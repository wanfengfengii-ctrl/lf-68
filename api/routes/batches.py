from flask import Blueprint, request, jsonify
from api.services import (
    get_all_batches,
    get_batch_detail,
    create_batch,
    update_batch,
    delete_batch,
    get_batch_applicability
)
from api.utils import (
    BatchCreate,
    BatchUpdate,
    handle_validation_error
)

bp = Blueprint('batches', __name__)

@bp.route('', methods=['GET'])
def list_batches():
    status = request.args.get('status')
    search = request.args.get('search')
    batches = get_all_batches(status=status, search=search)
    return jsonify(batches)

@bp.route('/<batch_id>', methods=['GET'])
def get_batch(batch_id):
    batch = get_batch_detail(batch_id)
    return jsonify(batch)

@bp.route('', methods=['POST'])
def create_batch_route():
    try:
        data = BatchCreate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    batch = create_batch(data)
    return jsonify(batch), 201

@bp.route('/<batch_id>', methods=['PUT'])
def update_batch_route(batch_id):
    try:
        data = BatchUpdate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    batch = update_batch(batch_id, data)
    return jsonify(batch)

@bp.route('/<batch_id>', methods=['DELETE'])
def delete_batch_route(batch_id):
    delete_batch(batch_id)
    return '', 204

@bp.route('/<batch_id>/applicability', methods=['GET'])
def get_applicability_route(batch_id):
    applicability = get_batch_applicability(batch_id)
    return jsonify(applicability)
