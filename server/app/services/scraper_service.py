from html.parser import HTMLParser
from typing import List

import httpx


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._chunks: List[str] = []

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self._chunks.append(text)

    def get_text(self) -> str:
        return "\n".join(self._chunks)


async def fetch_url_text(url: str) -> str:
    """
    Fetches a URL and extracts visible text content.
    Lightweight HTML-to-text conversion without extra dependencies.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    parser = _TextExtractor()
    parser.feed(resp.text)
    return parser.get_text()

