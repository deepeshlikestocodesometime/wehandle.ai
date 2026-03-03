from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .base import BaseModel

class Persona(BaseModel):
    __tablename__ = "personas"

    merchant_id = Column(ForeignKey("merchants.id"), unique=True, index=True)
    
    # --- IDENTITY STUDIO SLIDERS ---
    tone_of_voice = Column(String, default="Neutral")  # Options: 'Formal', 'Neutral', 'Friendly'
    emoji_density = Column(String, default="Moderate") # Options: 'None', 'Moderate', 'Always'
    response_length = Column(String, default="Concise") # Options: 'Concise', 'Detailed'
    
    merchant = relationship("Merchant", back_populates="persona") # We need to add this back-ref to Merchant later if needed

class KnowledgeChunk(BaseModel):
    __tablename__ = "knowledge_chunks"

    merchant_id = Column(ForeignKey("merchants.id"), index=True)
    
    # --- INTELLIGENCE HUB DATA ---
    source_type = Column(String) # e.g., 'PDF', 'Website', 'Manual'
    source_name = Column(String) # e.g., '30-Day Policy.pdf'
    content = Column(String, nullable=False) # The actual text chunk used for RAG
    
    # OpenAI 'text-embedding-3-small' uses 1536 dimensions
    embedding = Column(Vector(1536)) 
    
    # Tracks "AI Reference Count" shown in your UI (e.g., "142 hits")
    reference_count = Column(Integer, default=0)