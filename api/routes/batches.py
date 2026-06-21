from flask import Blueprint, request, jsonify
from api.services import (
    get_all_batches,
    get_batch_detail,
    create_batch,
    update_batch,
    delete_batch,
    get_batch_applicability,
    run_full_analysis,
    get_all_warnings,
    recommend_batches_for_process,
    get_batch_trace_chain,
)
from api.utils import (
    BatchCreate,
    BatchUpdate,
    handle_validation_error
)
from api.config import Config

bp = Blueprint('batches', __name__)

@bp.route('', methods=['GET'])
def list_batches():
    status = request.args.get('status')
    search = request.args.get('search')
    has_warning = request.args.get('hasWarning')
    batches = get_all_batches(status=status, search=search)
    
    if has_warning is not None:
        warning_flag = has_warning.lower() == 'true'
        batches = [b for b in batches if b.get('hasWarning', False) == warning_flag]
    
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

@bp.route('/<batch_id>/analyze', methods=['POST'])
def analyze_batch_route(batch_id):
    result = run_full_analysis(batch_id)
    return jsonify(result)

@bp.route('/warnings', methods=['GET'])
def get_warnings_route():
    result = get_all_warnings()
    return jsonify(result)

@bp.route('/warnings/refresh', methods=['POST'])
def refresh_warnings_route():
    from api.models import AshWaterBatch
    batches = AshWaterBatch.query.all()
    for batch in batches:
        try:
            run_full_analysis(batch.id)
        except Exception as e:
            pass
    
    result = get_all_warnings()
    return jsonify(result)

@bp.route('/recommend', methods=['GET'])
def recommend_batches_route():
    process = request.args.get('process')
    fabric_type = request.args.get('fabricType')
    min_volume = request.args.get('minVolume', 0, type=float)

    if process and process not in Config.PROCESS_PH_RANGES:
        return jsonify({
            'error': f'Invalid process type. Must be one of: {list(Config.PROCESS_PH_RANGES.keys())}',
            'code': 400
        }), 400

    result = recommend_batches_for_process(
        process=process,
        fabric_type=fabric_type,
        min_volume=min_volume
    )
    return jsonify(result)

@bp.route('/<batch_id>/trace', methods=['GET'])
def get_batch_trace_route(batch_id):
    result = get_batch_trace_chain(batch_id)
    if not result:
        return jsonify({'error': '批次不存在', 'code': 404}), 404
    return jsonify(result)
