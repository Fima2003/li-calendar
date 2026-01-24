import React, { useState, useEffect } from 'react';
import { DayData, Status, PostFormat, PostRule } from '@/types/calendar';
import { updateDay } from '@/services/calendarService';
import { getMatrix, recordCellUsage } from '@/services/matrixService';
import MatrixModal from './MatrixModal';
import HooksModal from './HooksModal';
import { useAuth } from './AuthContext';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DayModalProps {
    date: Date;
    initialData?: DayData;
    onClose: () => void;
}

const DayModal: React.FC<DayModalProps> = ({ date, initialData, onClose }) => {
    const [data, setData] = useState<DayData>(() => {
        const base = initialData || { date: date.toISOString().split('T')[0], status: Status.CHOOSE_TOPIC };
        if (base.notes && typeof base.notes === 'string') {
            base.notes = [base.notes];
        }
        if (!base.notes) base.notes = [];
        return base;
    });

    // Track initial data to detect changes for "Save?" dialog
    const [initialState, setInitialState] = useState<string>(JSON.stringify(data));
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    const [showMatrixSelect, setShowMatrixSelect] = useState(false);
    const [showHooksModal, setShowHooksModal] = useState(false);
    const { user } = useAuth();

    const isLocked = data.status === Status.POST;

    const handleSave = async (newData: DayData = data) => {
        if (user) {
            await updateDay(newData, user.uid);
        }
        // Update initial state so further closes don't prompt
        setInitialState(JSON.stringify(newData));
    };

    const handleSaveAndClose = async () => {
        await handleSave();
        onClose();
    };

    const handlePublish = async () => {
        const newData = { ...data, status: Status.POST };
        setData(newData);
        await handleSave(newData);
        onClose();
    };

    const handleChange = (field: keyof DayData, value: any) => {
        if (isLocked) return;
        setData(prev => ({ ...prev, [field]: value }));
    };

    // Note handling
    const handleAddNote = () => {
        if (isLocked) return;
        const currentNotes = data.notes || [];
        handleChange('notes', [...currentNotes, '']);
    };

    const handleNoteChange = (index: number, value: string) => {
        if (isLocked) return;
        const currentNotes = [...(data.notes || [])];
        currentNotes[index] = value;
        handleChange('notes', currentNotes);
    };

    const handleRemoveNote = (index: number) => {
        if (isLocked) return;
        const currentNotes = [...(data.notes || [])];
        currentNotes.splice(index, 1);
        handleChange('notes', currentNotes);
    };

    const handleCloseAttempt = () => {
        const currentString = JSON.stringify(data);
        if (currentString !== initialState) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    // Sync from Matrix if referenced
    useEffect(() => {
        const syncMatrixData = async () => {
            if (user && data.matrixReference && data.status !== Status.POST) {
                const matrix = await getMatrix(user.uid);
                if (matrix && matrix.cells) {
                    const { rowIndex, colIndex } = data.matrixReference;
                    const cellValue = matrix.cells[rowIndex]?.[colIndex];
                    if (cellValue && cellValue !== data.topic) {
                        handleChange('topic', cellValue);
                    }
                }
            }
        };
        syncMatrixData();
    }, [user, data.matrixReference, data.status]);

    const handleMatrixSelect = (rowIndex: number, colIndex: number, text: string) => {
        const newData = {
            ...data,
            topic: text,
            matrixReference: { rowIndex, colIndex }
        };
        setData(newData);
        setShowMatrixSelect(false);
    };

    const handleDereference = () => {
        if (isLocked) return;
        handleChange('matrixReference', null);
    };


    const [isLinkedConnected, setIsLinkedConnected] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        const checkConnection = async () => {
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid, "integrations", "linkedin");
                    const docSnap = await getDoc(docRef);
                    setIsLinkedConnected(docSnap.exists());
                } catch (e) {
                    console.error("Failed to check linkedin connection", e);
                }
            }
        };
        checkConnection();
    }, [user]);

    const handlePostToLinkedIn = async () => {
        if (!user || !data.finalText) return;
        setIsPosting(true);
        try {
            const resp = await fetch("/api/linkedin/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    content: data.finalText
                })
            });

            const result = await resp.json();
            if (!resp.ok) {
                alert("Failed to post: " + (result.error || "Unknown error"));
            } else {
                alert("Posted successfully!");
                // Optionally auto-close or update status?
                // Status is already POST.
            }
        } catch (e) {
            console.error("Post error", e);
            alert("Error posting to LinkedIn");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-neo-black shadow-neo-lg w-full max-w-5xl h-[90vh] flex flex-col relative">

                {/* Header */}
                <div className="p-4 border-b-4 border-black flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="font-black text-2xl border-2 border-black px-3 py-1 bg-white">
                            {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                        </div>
                    </div>
                    {/* Close Button */}
                    <button onClick={handleCloseAttempt} className="neo-button bg-neo-pink p-2 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmClose && (
                    <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white border-4 border-black p-6 shadow-neo-lg max-w-sm w-full text-center">
                            <h3 className="text-xl font-black mb-4 uppercase">Save Changes?</h3>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        onClose(); // No
                                    }}
                                    className="neo-button bg-neo-red w-20"
                                >
                                    No
                                </button>
                                <button
                                    onClick={handleSaveAndClose}
                                    className="neo-button bg-neo-green w-20"
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body - 2 Columns */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                    {/* LEFT COLUMN: Topic, Text, Config */}
                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto border-r-0 md:border-r-4 border-black">

                        {/* Topic Input */}
                        <div className="flex gap-2">
                            {data.matrixReference ? (
                                <div className="flex-1 flex items-center neo-input bg-gray-100 text-gray-500 italic relative group">
                                    <span className="truncate pr-8">{data.topic}</span>
                                    <button
                                        onClick={handleDereference}
                                        disabled={isLocked}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 disabled:opacity-0"
                                        title="Unlink from Matrix"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className={`neo-input flex-1 font-bold text-lg ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Enter The Topic for the post"
                                    value={data.topic || ''}
                                    onChange={(e) => handleChange('topic', e.target.value)}
                                    disabled={isLocked}
                                />
                            )}

                            {!data.matrixReference && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowHooksModal(true)}
                                        disabled={isLocked}
                                        className="neo-button bg-neo-yellow p-2 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Reuse Hooks"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M18 6L6 18M6 6l12 12" style={{ display: 'none' }} />
                                            <path d="M8 12a4 4 0 1 1 8 0c0-1.01-.25-1.97-.7-2.8"></path><path d="M10 2h4"></path><path d="M12 2v2"></path>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowMatrixSelect(true)}
                                        disabled={isLocked}
                                        className="neo-button bg-neo-pink p-2 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Choose from Matrix"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <path d="M9 3v18 M15 3v18 M3 9h18 M3 15h18" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Main Text Area */}
                        <div className="flex-1 flex flex-col">
                            <textarea
                                className={`neo-input flex-1 w-full resize-none p-4 text-base font-medium ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Enter the Text for the post"
                                value={data.finalText || ''}
                                onChange={(e) => handleChange('finalText', e.target.value)}
                                disabled={isLocked}
                            />
                        </div>

                        {/* Format & Rule Selectors */}
                        <div className="grid grid-cols-2 gap-8 pt-2">
                            <div className="relative border-b-4 border-black pb-1">
                                <label className="block text-xs font-black uppercase mb-1">Text Post</label>
                                <select
                                    className={`appearance-none bg-transparent w-full font-bold focus:outline-none cursor-pointer ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                    value={data.format || ''}
                                    onChange={(e) => handleChange('format', e.target.value as PostFormat)}
                                    disabled={isLocked}
                                >
                                    <option value="" disabled>Format</option>
                                    {Object.values(PostFormat).map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <div className="absolute right-0 bottom-2 pointer-events-none">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>

                            <div className="relative border-b-4 border-black pb-1">
                                <label className="block text-xs font-black uppercase mb-1">Rule</label>
                                <select
                                    className={`appearance-none bg-transparent w-full font-bold focus:outline-none cursor-pointer ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                    value={data.rule || ''}
                                    onChange={(e) => handleChange('rule', e.target.value as PostRule)}
                                    disabled={isLocked}
                                >
                                    <option value="" disabled>Rule</option>
                                    {Object.values(PostRule).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <div className="absolute right-0 bottom-2 pointer-events-none">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            {data.status === Status.POST && isLinkedConnected ? (
                                <button
                                    onClick={handlePostToLinkedIn}
                                    disabled={isPosting}
                                    className="neo-button bg-neo-blue py-3 text-lg font-black uppercase tracking-wider disabled:opacity-50"
                                >
                                    {isPosting ? "Posting..." : "Post to LinkedIn"}
                                </button>
                            ) : (
                                <button
                                    onClick={handlePublish}
                                    disabled={isLocked}
                                    className="neo-button bg-neo-blue py-3 text-lg font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Publish
                                </button>
                            )}
                            <button
                                onClick={() => handleSave()}
                                className="neo-button bg-neo-green py-3 text-lg font-black uppercase tracking-wider"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Notes */}
                    <div className="md:w-1/3 bg-gray-200 p-6 flex flex-col overflow-y-auto">
                        <h3 className="font-black text-2xl uppercase mb-6">Notes</h3>

                        <div className="flex flex-col gap-3">
                            {data.notes?.map((note, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        className={`neo-input flex-1 py-1 px-2 text-sm font-bold ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        placeholder={`Note ${idx + 1}`}
                                        value={note}
                                        onChange={(e) => handleNoteChange(idx, e.target.value)}
                                        disabled={isLocked}
                                    />
                                    <button
                                        onClick={() => handleRemoveNote(idx)}
                                        disabled={isLocked}
                                        className="text-black hover:text-red-600 font-bold px-1 disabled:opacity-0"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddNote}
                            disabled={isLocked}
                            className="neo-button bg-gray-300 mt-4 py-2 flex items-center justify-center font-black text-xl hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {showMatrixSelect && (
                <MatrixModal
                    onClose={() => setShowMatrixSelect(false)}
                    mode="select"
                    onSelect={handleMatrixSelect}
                />
            )}

            {showHooksModal && (
                <HooksModal onClose={() => setShowHooksModal(false)} />
            )}
        </div>
    );
};

export default DayModal;
