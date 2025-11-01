"""
Pydantic schemas for API request and response models
"""

from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""
    prompt: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Hello, how are you feeling today?"
            }
        }


class ChatResponse(BaseModel):
    """Response schema for chat endpoint"""
    response: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "I'm doing well, thank you for asking!"
            }
        }


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Prompt is required."
            }
        }
