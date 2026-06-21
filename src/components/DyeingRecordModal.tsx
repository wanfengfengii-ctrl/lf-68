import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import Modal from './Modal';
import { useAppStore } from '@/store';
import type {
  DyeingRecordCreateForm,
  DyeingRecordUpdateForm,
  DyeingProcess,
  FabricType,
  DyeMaterial,
  MordantMethod,
  ApiError,
  AshWaterBatch,
  DyeingRecord,
} from '@/types';

interface DyeingRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  batchId?: string;
  batch?: AshWaterBatch | null;
  record?: DyeingRecord | null;
  mode?: 'create' | 'edit';
}

export default function DyeingRecordModal({
  isOpen,
  onClose,
  onSuccess,
  batchId,
  batch,
  record,
  mode = 'create',
}: DyeingRecordModalProps) {
  const addDyeingRecord = useAppStore((state) => state.addDyeingRecord);
  const updateDyeingRecord = useAppStore((state) => state.updateDyeingRecord);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);

  const [form, setForm] = useState<DyeingRecordCreateForm | DyeingRecordUpdateForm>({
    dyeingDate: new Date().toISOString().slice(0, 16),
    fabricType: 'cotton',
    targetColor: '',
    dyeMaterial: 'indigo',
    mordantMethod: 'alum',
    dyeConcentration: 50,
    heatingTimeMinutes: 60,
    dyeingCount: 1,
    redyeCount: 0,
    colorResult: '',
    colorFastness: undefined,
    process: 'dyeing',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (record && mode === 'edit') {
      setForm({
        dyeingDate: record.dyeingDate.slice(0, 16),
        fabricType: record.fabricType,
        targetColor: record.targetColor,
        dyeMaterial: record.dyeMaterial,
        mordantMethod: record.mordantMethod,
        dyeConcentration: record.dyeConcentration,
        heatingTimeMinutes: record.heatingTimeMinutes,
        dyeingCount: record.dyeingCount,
        redyeCount: record.redyeCount,
        colorResult: record.colorResult || '',
        colorFastness: record.colorFastness,
        process: record.process,
        notes: record.notes || '',
      });
    } else if (isOpen) {
      setForm({
        dyeingDate: new Date().toISOString().slice(0, 16),
        fabricType: 'cotton',
        targetColor: '',
        dyeMaterial: 'indigo',
        mordantMethod: 'alum',
        dyeConcentration: 50,
        heatingTimeMinutes: 60,
        dyeingCount: 1,
        redyeCount: 0,
        colorResult: '',
        colorFastness: undefined,
        process: 'dyeing',
        notes: '',
      });
    }
  }, [record, mode, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.targetColor?.trim()) {
      newErrors.targetColor = '请输入目标颜色';
    }
    if (!form.dyeConcentration || form.dyeConcentration <= 0 || form.dyeConcentration > 100) {
      newErrors.dyeConcentration = '染液浓度必须在0-100之间';
    }
    if (!form.heatingTimeMinutes || form.heatingTimeMinutes < 1) {
      newErrors.heatingTimeMinutes = '加热时间必须大于0';
    }
    if (!form.dyeingCount || form.dyeingCount < 1) {
      newErrors.dyeingCount = '染色次数必须大于0';
    }
    if (form.redyeCount === undefined || form.redyeCount < 0) {
      newErrors.redyeCount = '复染次数不能小于0';
    }
    if (form.colorFastness !== undefined && (form.colorFastness < 1 || form.colorFastness > 5)) {
      newErrors.colorFastness = '色牢度等级必须在1-5之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      if (mode === 'edit' && record) {
        await updateDyeingRecord(record.id, form as DyeingRecordUpdateForm);
      } else if (batchId) {
        await addDyeingRecord(batchId, form as DyeingRecordCreateForm);
      }
      onClose();
      onSuccess?.();
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError.error || '提交失败，请重试');
    }
  };

  const processes = Object.entries(config?.processNames || {}).map(([key, name]) => ({
    value: key as DyeingProcess,
    label: name,
  }));

  const fabricTypes = Object.entries(config?.fabricTypes || {}).map(([key, name]) => ({
    value: key as FabricType,
    label: name,
  }));

  const dyeMaterials = Object.entries(config?.dyeMaterials || {}).map(([key, name]) => ({
    value: key as DyeMaterial,
    label: name,
  }));

  const mordantMethods = Object.entries(config?.mordantMethods || {}).map(([key, name]) => ({
    value: key as MordantMethod,
    label: name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? '编辑染色记录' : '新增染色记录'}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {submitError}
          </div>
        )}

        {batch && (
          <div className="bg-parchment-200 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">批次编号</span>
                <span className="font-medium text-earth-900">{batch.batchNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">原料来源</span>
                <span className="font-medium text-earth-900">{batch.rawMaterialSource}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">总容量</span>
                <span className="font-medium text-earth-900">{batch.waterVolume}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">当前PH值</span>
                <span
                  className={`font-medium ${batch.currentPh !== null && batch.currentPh >= 8.5 && batch.currentPh <= 12.5 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {batch.currentPh?.toFixed(1) || '未检测'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">染色日期</label>
            <input
              type="datetime-local"
              value={form.dyeingDate}
              onChange={(e) => setForm({ ...form, dyeingDate: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">染色工序 *</label>
            <select
              value={form.process}
              onChange={(e) => setForm({ ...form, process: e.target.value as DyeingProcess })}
              className="input"
            >
              {processes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">布料类型 *</label>
            <select
              value={form.fabricType}
              onChange={(e) => setForm({ ...form, fabricType: e.target.value as FabricType })}
              className="input"
            >
              {fabricTypes.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">目标颜色 *</label>
            <input
              type="text"
              value={form.targetColor}
              onChange={(e) => setForm({ ...form, targetColor: e.target.value })}
              className={`input ${errors.targetColor ? 'input-error' : ''}`}
              placeholder="如：靛蓝、茜草红等"
            />
            {errors.targetColor && (
              <p className="text-red-500 text-sm mt-1">{errors.targetColor}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">染材种类 *</label>
            <select
              value={form.dyeMaterial}
              onChange={(e) => setForm({ ...form, dyeMaterial: e.target.value as DyeMaterial })}
              className="input"
            >
              {dyeMaterials.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">媒染方式 *</label>
            <select
              value={form.mordantMethod}
              onChange={(e) => setForm({ ...form, mordantMethod: e.target.value as MordantMethod })}
              className="input"
            >
              {mordantMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">染液浓度(%) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={form.dyeConcentration}
              onChange={(e) =>
                setForm({ ...form, dyeConcentration: parseFloat(e.target.value) || 0 })
              }
              className={`input ${errors.dyeConcentration ? 'input-error' : ''}`}
              placeholder="50"
            />
            {errors.dyeConcentration && (
              <p className="text-red-500 text-sm mt-1">{errors.dyeConcentration}</p>
            )}
          </div>
          <div>
            <label className="label">加热时间(分钟) *</label>
            <input
              type="number"
              min="1"
              value={form.heatingTimeMinutes}
              onChange={(e) =>
                setForm({ ...form, heatingTimeMinutes: parseInt(e.target.value) || 0 })
              }
              className={`input ${errors.heatingTimeMinutes ? 'input-error' : ''}`}
              placeholder="60"
            />
            {errors.heatingTimeMinutes && (
              <p className="text-red-500 text-sm mt-1">{errors.heatingTimeMinutes}</p>
            )}
          </div>
          <div>
            <label className="label">染色次数 *</label>
            <input
              type="number"
              min="1"
              value={form.dyeingCount}
              onChange={(e) =>
                setForm({ ...form, dyeingCount: parseInt(e.target.value) || 0 })
              }
              className={`input ${errors.dyeingCount ? 'input-error' : ''}`}
              placeholder="1"
            />
            {errors.dyeingCount && (
              <p className="text-red-500 text-sm mt-1">{errors.dyeingCount}</p>
            )}
          </div>
          <div>
            <label className="label">复染次数 *</label>
            <input
              type="number"
              min="0"
              value={form.redyeCount}
              onChange={(e) =>
                setForm({ ...form, redyeCount: parseInt(e.target.value) || 0 })
              }
              className={`input ${errors.redyeCount ? 'input-error' : ''}`}
              placeholder="0"
            />
            {errors.redyeCount && (
              <p className="text-red-500 text-sm mt-1">{errors.redyeCount}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">成色结果</label>
            <input
              type="text"
              value={form.colorResult}
              onChange={(e) => setForm({ ...form, colorResult: e.target.value })}
              className="input"
              placeholder="实际染色结果描述"
            />
          </div>
          <div>
            <label className="label">色牢度等级 (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={form.colorFastness ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  colorFastness: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className={`input ${errors.colorFastness ? 'input-error' : ''}`}
              placeholder="可选"
            />
            {errors.colorFastness && (
              <p className="text-red-500 text-sm mt-1">{errors.colorFastness}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input min-h-[80px]"
            placeholder="记录染色过程中的特殊情况、观察到的现象等..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-earth-200">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading}
          >
            <Palette className="w-4 h-4" />
            {loading ? '提交中...' : mode === 'edit' ? '保存修改' : '确认添加'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
