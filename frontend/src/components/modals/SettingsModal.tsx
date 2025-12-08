import { useState } from 'react';
import { useSettingsStore, DEFAULT_MODEL_SETTINGS, DEFAULT_RETRIEVAL_SETTINGS } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';
import type { ModelSettings } from '../../types';

const CHAT_MODEL_SUGGESTIONS = [
  'gpt-4.1',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-5.1',
  'qwen2.5-72b-instruct',
  'glm-4-plus'
];

const EMBEDDING_MODEL_SUGGESTIONS = [
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002',
  'bge-large-zh-v1.5'
];

export default function SettingsModal() {
  const { retrieval, model, updateRetrievalSettings, updateModelSettings, resetSettings, saveSettings } = useSettingsStore();
  const { closeSettings, settings } = useUIStore();
  const [activeTab, setActiveTab] = useState<'retrieval' | 'model'>(settings.activeTab);

  const normalizeModel = (m: ModelSettings): ModelSettings => ({
    ...m,
    chatBaseUrl: m.chatBaseUrl || m.baseUrl || '',
    chatApiKey: m.chatApiKey || m.apiKey || '',
    embeddingBaseUrl: m.embeddingBaseUrl || m.baseUrl || '',
    embeddingApiKey: m.embeddingApiKey || m.apiKey || ''
  });

  const [tempRetrieval, setTempRetrieval] = useState({ ...retrieval });
  const [tempModel, setTempModel] = useState(normalizeModel(model));

  const handleSave = async () => {
    updateRetrievalSettings(tempRetrieval);
    updateModelSettings(tempModel);
    await saveSettings({ retrieval: tempRetrieval, model: tempModel });
    closeSettings();
  };

  const handleReset = () => {
    resetSettings();
    setTempRetrieval({ ...DEFAULT_RETRIEVAL_SETTINGS });
    setTempModel(normalizeModel(DEFAULT_MODEL_SETTINGS));
  };

  const handleCancel = () => {
    setTempRetrieval({ ...retrieval });
    setTempModel(normalizeModel(model));
    closeSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">设置</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab('retrieval')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'retrieval'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              检索设置
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('model')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'model'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              模型设置
            </button>
          </nav>
        </div>

        <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'retrieval' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="topK" className="block text-sm font-medium text-gray-700 mb-1">
                  检索数量 (Top-K)
                </label>
                <input
                  type="number"
                  id="topK"
                  min="1"
                  max="20"
                  value={tempRetrieval.topK}
                  onChange={(e) => setTempRetrieval({ ...tempRetrieval, topK: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">设置检索返回的相关文档块数量，建议3-10个</p>
              </div>

              <div>
                <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
                  相似度阈值
                </label>
                <input
                  type="number"
                  id="threshold"
                  min="0"
                  max="1"
                  step="0.1"
                  value={tempRetrieval.threshold}
                  onChange={(e) => setTempRetrieval({ ...tempRetrieval, threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">设置检索的最低相似度阈值，范围0-1，建议0.3-0.7</p>
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="text-sm font-medium text-gray-800">聊天模型</div>
                  <div className="space-y-2">
                    <label htmlFor="chatBaseUrl" className="block text-xs text-gray-600">
                      Base URL
                    </label>
                    <input
                      id="chatBaseUrl"
                      type="url"
                      value={tempModel.chatBaseUrl || ''}
                      onChange={(e) => setTempModel({ ...tempModel, chatBaseUrl: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="chatApiKey" className="block text-xs text-gray-600">
                      API Key
                    </label>
                    <input
                      id="chatApiKey"
                      type="password"
                      value={tempModel.chatApiKey || ''}
                      onChange={(e) => setTempModel({ ...tempModel, chatApiKey: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="sk-..."
                    />
                    <p className="text-[11px] text-gray-500">仅本地保存，用于生成回复</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="chatModel" className="block text-xs text-gray-600">
                      模型名称
                    </label>
                    <input
                      id="chatModel"
                      type="text"
                      list="chatModelSuggestions"
                      value={tempModel.chatModel}
                      onChange={(e) => setTempModel({ ...tempModel, chatModel: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="如 gpt-4o-mini"
                    />
                    <datalist id="chatModelSuggestions">
                      {CHAT_MODEL_SUGGESTIONS.map(modelName => (
                        <option key={modelName} value={modelName} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label htmlFor="temperature" className="block text-xs text-gray-600">
                        温度
                      </label>
                      <input
                        type="number"
                        id="temperature"
                        min="0"
                        max="2"
                        step="0.1"
                        value={tempModel.temperature}
                        onChange={(e) => setTempModel({ ...tempModel, temperature: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="maxTokens" className="block text-xs text-gray-600">
                        最大 Token
                      </label>
                      <input
                        type="number"
                        id="maxTokens"
                        min="128"
                        max="4096"
                        step="128"
                        value={tempModel.maxTokens}
                        onChange={(e) => setTempModel({ ...tempModel, maxTokens: parseInt(e.target.value) || 128 })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="text-sm font-medium text-gray-800">嵌入模型</div>
                  <div className="space-y-2">
                    <label htmlFor="embeddingBaseUrl" className="block text-xs text-gray-600">
                      Base URL
                    </label>
                    <input
                      id="embeddingBaseUrl"
                      type="url"
                      value={tempModel.embeddingBaseUrl || ''}
                      onChange={(e) => setTempModel({ ...tempModel, embeddingBaseUrl: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="embeddingApiKey" className="block text-xs text-gray-600">
                      API Key
                    </label>
                    <input
                      id="embeddingApiKey"
                      type="password"
                      value={tempModel.embeddingApiKey || ''}
                      onChange={(e) => setTempModel({ ...tempModel, embeddingApiKey: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="sk-..."
                    />
                    <p className="text-[11px] text-gray-500">仅本地保存，用于查询嵌入</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="embeddingModel" className="block text-xs text-gray-600">
                      模型名称
                    </label>
                    <input
                      id="embeddingModel"
                      type="text"
                      list="embeddingModelSuggestions"
                      value={tempModel.embeddingModel}
                      onChange={(e) => setTempModel({ ...tempModel, embeddingModel: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="如 text-embedding-3-large"
                    />
                    <datalist id="embeddingModelSuggestions">
                      {EMBEDDING_MODEL_SUGGESTIONS.map(modelName => (
                        <option key={modelName} value={modelName} />
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[11px] text-gray-500">请与文档向量化所用模型保持一致</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            恢复默认
          </Button>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
