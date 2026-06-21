from flask import Blueprint, request, jsonify
from api.services import get_ph_records, add_ph_record
from api.utils import PhRecordCreate, handle_validation_error

bp = Blueprint('ph_records', __name__)

@bp.route('/<batch_id>/ph-records', methods=['GET'])
def list_ph_records(batch_id):
    records = get_ph_records(batch_id)
    return jsonify(records)

@bp.route('/<batch_id>/ph-records', methods=['POST'])
def add_ph_record_route(batch_id):
    try:
        data = PhRecordCreate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    record = add_ph_record(batch_id, data)
    return jsonify(record), 201
