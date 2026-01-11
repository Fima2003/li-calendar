import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getHooks, saveHooks } from '@/services/hooksService';

interface HooksModalProps {
    onClose: () => void;
}

const HooksModal: React.FC<HooksModalProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [hooks, setHooks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialState, setInitialState] = useState<string>('[]');
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    useEffect(() => {
        const loadHooks = async () => {
            if (user) {
                const loadedHooks = await getHooks(user.uid);
                setHooks(loadedHooks);
                setInitialState(JSON.stringify(loadedHooks));
            }
            setLoading(false);
        };
        loadHooks();
    }, [user]);

    const handleSave = async (shouldClose = false) => {
        if (user) {
            await saveHooks(user.uid, hooks);
            setInitialState(JSON.stringify(hooks));
            if (shouldClose) {
                onClose();
            }
        }
    };

    const handleChange = (index: number, value: string) => {
        const newHooks = [...hooks];
        newHooks[index] = value;
        setHooks(newHooks);
    };

    const handleAdd = () => {
        setHooks([...hooks, '']);
    };

    const handleRemove = (index: number) => {
        const newHooks = [...hooks];
        newHooks.splice(index, 1);
        setHooks(newHooks);
    };

    const handleCloseAttempt = () => {
        const currentString = JSON.stringify(hooks);
        if (currentString !== initialState) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white border-4 border-neo-black shadow-neo-lg w-full max-w-lg flex flex-col relative max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b-4 border-black flex justify-between items-center bg-neo-yellow">
                    <h2 className="text-2xl font-black uppercase">Hooks</h2>
                    <button onClick={handleCloseAttempt} className="neo-button bg-neo-pink p-2 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Confirm Dialog */}
                {showConfirmClose && (
                    <div className="absolute inset-0 z-50 bg-white/90 flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-xl font-black mb-4">Unsaved Changes</h3>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => onClose()} className="neo-button bg-neo-red">Discard</button>
                                <button onClick={() => handleSave(true)} className="neo-button bg-neo-green">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
                    {hooks.map((hook, idx) => (
                        <div key={idx} className="flex gap-2">
                            <textarea
                                className="neo-input flex-1 resize-none h-20 text-sm font-bold"
                                value={hook}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                placeholder="Write a hook..."
                            />
                            <div className="flex flex-col gap-1 items-center">
                                <button
                                    onClick={() => handleRemove(idx)}
                                    className="neo-button bg-neo-red w-8 h-8 flex items-center justify-center p-0 text-sm hover:bg-red-400"
                                    title="Delete"
                                >
                                    X
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(hook)}
                                    className="neo-button bg-neo-blue w-8 h-8 flex items-center justify-center p-0 hover:bg-cyan-300"
                                    title="Copy"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    <button onClick={handleAdd} className="neo-button bg-gray-200 mt-2 flex items-center justify-center font-black text-xl hover:bg-gray-300">
                        +
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t-4 border-black bg-white flex justify-end">
                    <button onClick={() => handleSave(false)} className="neo-button bg-neo-green">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HooksModal;
