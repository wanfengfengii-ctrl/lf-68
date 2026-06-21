from datetime import datetime
from .database import db

class FilterRecord(db.Model):
    __tablename__ = 'filter_record'

    id = db.Column(db.String(50), primary_key=True)
    batch_id = db.Column(db.String(50), db.ForeignKey('ash_water_batch.id', ondelete='CASCADE'), nullable=False)
    filter_date = db.Column(db.DateTime, nullable=False)
    filter_method = db.Column(db.String(100))
    filter_count = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'batchId': self.batch_id,
            'filterDate': self.filter_date.isoformat() if self.filter_date else None,
            'filterMethod': self.filter_method,
            'filterCount': self.filter_count,
            'notes': self.notes
        }
