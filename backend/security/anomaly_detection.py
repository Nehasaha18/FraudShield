import logging
import json
from datetime import datetime
from typing import Dict, Any
import redis
from collections import defaultdict
import asyncio

# Configure logging
logging.basicConfig(
    filename='logs/anomaly_detection.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('anomaly_detection')

class AnomalyDetector:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        try:
            self.redis_client = redis.from_url(redis_url)
            self.anomaly_thresholds = {
                "failed_login_attempts": 5,
                "rapid_requests": 100,  # per minute
                "large_transaction_count": 50,  # per hour
                "suspicious_pattern_score": 0.8
            }
        except:
            logger.warning("Redis not available, using in-memory storage")
            self.redis_client = None
            self.memory_store = defaultdict(list)
    
    async def log_event(self, event_type: str, user_id: str, details: Dict[str, Any]):
        """Log security event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "details": details
        }
        
        # Log to file
        logger.info(json.dumps(event))
        
        # Store in Redis or memory
        if self.redis_client:
            key = f"security_events:{user_id}:{event_type}"
            self.redis_client.lpush(key, json.dumps(event))
            self.redis_client.expire(key, 3600)  # Expire after 1 hour
        else:
            self.memory_store[f"{user_id}:{event_type}"].append(event)
        
        # Check for anomalies
        await self.check_anomalies(event_type, user_id)
    
    async def check_anomalies(self, event_type: str, user_id: str):
        """Check for anomalous patterns"""
        if event_type == "failed_login":
            count = await self.get_event_count(user_id, event_type, 300)  # Last 5 minutes
            if count >= self.anomaly_thresholds["failed_login_attempts"]:
                await self.raise_alert("Multiple failed login attempts", user_id, {
                    "count": count,
                    "threshold": self.anomaly_thresholds["failed_login_attempts"]
                })
        
        elif event_type == "api_request":
            count = await self.get_event_count(user_id, event_type, 60)  # Last minute
            if count >= self.anomaly_thresholds["rapid_requests"]:
                await self.raise_alert("Rapid API requests detected", user_id, {
                    "count": count,
                    "threshold": self.anomaly_thresholds["rapid_requests"]
                })
    
    async def get_event_count(self, user_id: str, event_type: str, time_window: int) -> int:
        """Get event count within time window"""
        if self.redis_client:
            key = f"security_events:{user_id}:{event_type}"
            events = self.redis_client.lrange(key, 0, -1)
            count = 0
            cutoff_time = datetime.utcnow().timestamp() - time_window
            
            for event_str in events:
                event = json.loads(event_str)
                event_time = datetime.fromisoformat(event['timestamp']).timestamp()
                if event_time >= cutoff_time:
                    count += 1
            return count
        else:
            # Use memory store
            key = f"{user_id}:{event_type}"
            events = self.memory_store.get(key, [])
            cutoff_time = datetime.utcnow().timestamp() - time_window
            
            count = sum(1 for event in events 
                       if datetime.fromisoformat(event['timestamp']).timestamp() >= cutoff_time)
            return count
    
    async def raise_alert(self, alert_type: str, user_id: str, details: Dict[str, Any]):
        """Raise security alert"""
        alert = {
            "timestamp": datetime.utcnow().isoformat(),
            "alert_type": alert_type,
            "user_id": user_id,
            "details": details,
            "severity": "HIGH"
        }
        
        logger.warning(f"SECURITY ALERT: {json.dumps(alert)}")
        
        # In production, this would trigger notifications
        # For now, just log it
        if self.redis_client:
            self.redis_client.lpush("security_alerts", json.dumps(alert))
            self.redis_client.expire("security_alerts", 86400)  # 24 hours

# Global instance
anomaly_detector = AnomalyDetector()