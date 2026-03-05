import os
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.merchant import Merchant


class ShopifyBridge:
    """
    Thin async wrapper around the Shopify Admin GraphQL API for a single merchant.
    """

    def __init__(self, db: AsyncSession):
        self._db = db

    async def _get_merchant(self, merchant_id: UUID) -> Merchant:
        result = await self._db.execute(select(Merchant).where(Merchant.id == merchant_id))
        merchant = result.scalar_one_or_none()
        if not merchant:
            raise ValueError("Merchant not found")
        if not merchant.shopify_access_token or not merchant.shopify_shop_url:
            raise ValueError("Merchant is not connected to Shopify")
        return merchant

    async def _graphql(
        self,
        merchant: Merchant,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        endpoint = merchant.shopify_shop_url.rstrip("/") + "/admin/api/2023-10/graphql.json"
        headers = {
            "X-Shopify-Access-Token": merchant.shopify_access_token,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(endpoint, json={"query": query, "variables": variables or {}}, headers=headers)

        if resp.status_code == 429:
            # API Rate Limit
            return {"error": "rate_limit", "detail": "Shopify API rate limit exceeded"}

        if resp.status_code >= 400:
            return {"error": "http_error", "status": resp.status_code, "detail": resp.text}

        data = resp.json()
        if "errors" in data:
            return {"error": "graphql_error", "detail": data["errors"]}
        return data.get("data", {})

    async def get_customer_context(self, email: str, merchant_id: UUID) -> Dict[str, Any]:
        """
        Fetches a stitched Shopify context for the customer:
        - Last 5 orders (line items, prices, statuses)
        - Tracking URLs for active fulfillments
        - Refund / return history
        - Customer lifetime data (total spent, tags, note)
        """
        merchant = await self._get_merchant(merchant_id)

        # GraphQL query for customer + last 5 orders
        query = """
        query CustomerContext($email: String!, $limit: Int!) {
          customers(first: 1, query: $email) {
            edges {
              node {
                id
                displayName
                email
                tags
                note
                lifetimeDuration
                orders(first: $limit, sortKey: PROCESSED_AT, reverse: true) {
                  edges {
                    node {
                      id
                      name
                      processedAt
                      financialStatus
                      fulfillmentStatus
                      totalPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                      lineItems(first: 10) {
                        edges {
                          node {
                            name
                            quantity
                            discountedTotalSet {
                              shopMoney {
                                amount
                                currencyCode
                              }
                            }
                          }
                        }
                      }
                      fulfillments(first: 5) {
                        trackingInfo(first: 5) {
                          number
                          url
                          company
                        }
                      }
                      refunds(first: 5) {
                        createdAt
                        totalSet {
                          shopMoney {
                            amount
                            currencyCode
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """

        data = await self._graphql(
            merchant,
            query,
            variables={"email": email, "limit": 5},
        )

        if "error" in data:
            # Bubble up structured error for the AI layer to reason about
            return {"shopify_error": data}

        customers = data.get("customers", {}).get("edges", [])
        if not customers:
            # Customer Not Found scenario
            return {"customer_found": False}

        customer_node = customers[0]["node"]

        orders_edges: List[Dict[str, Any]] = customer_node.get("orders", {}).get("edges", [])
        orders = [edge["node"] for edge in orders_edges]

        context: Dict[str, Any] = {
          "customer_found": True,
          "customer": {
            "name": customer_node.get("displayName"),
            "email": customer_node.get("email"),
            "tags": customer_node.get("tags", []),
            "note": customer_node.get("note"),
          },
          "orders": orders,
        }

        return context

