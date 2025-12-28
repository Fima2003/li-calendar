import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getMatrix, saveMatrix, MatrixData } from '@/services/matrixService';

// Icons
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

interface MatrixModalProps {
    onClose: () => void;
    mode?: 'edit' | 'select';
    onSelect?: (rowIndex: number, colIndex: number, text: string) => void;
}

const MatrixModal: React.FC<MatrixModalProps> = ({ onClose, mode = 'edit', onSelect }) => {
    const { user } = useAuth();

    // Initial State Headers
    const [colHeaders, setColHeaders] = useState<string[]>([
        "Actionable", "Motivational", "Analytical", "Contrarian", "Observational", "Listicle"
    ]);
    const [rowHeaders, setRowHeaders] = useState<string[]>(["Edit me"]);

    // Cells: Row-major [rowIndex][colIndex]
    const [cells, setCells] = useState<string[][]>([
        new Array(6).fill("")
    ]);

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Show toast helper
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Load Data on Mount
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                const data = await getMatrix(user.uid);
                if (data) {
                    setColHeaders(data.colHeaders || []);
                    setRowHeaders(data.rowHeaders || []);
                    setCells(data.cells || []);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    // Handle Close Attempt
    const handleCloseAttempt = () => {
        if (isDirty) {
            setShowConfirmDialog(true);
        } else {
            onClose();
        }
    };

    // Save Data
    const handleSave = async (shouldClose = false) => {
        if (!user) return;

        const data: MatrixData = {
            colHeaders,
            rowHeaders,
            cells
        };

        const success = await saveMatrix(user.uid, data);
        if (success) {
            setIsDirty(false);
            if (shouldClose) {
                onClose();
            } else {
                showToast("Matrix Saved!");
            }
        } else {
            showToast("Error saving matrix");
        }
    };

    // --- Column Logic ---
    const updateColHeader = (index: number, value: string) => {
        const newCols = [...colHeaders];
        newCols[index] = value;
        setColHeaders(newCols);
        setIsDirty(true);
    };

    const deleteCol = (index: number) => {
        if (colHeaders.length <= 1) return;
        const newCols = colHeaders.filter((_, i) => i !== index);
        const newCells = cells.map(row => row.filter((_, i) => i !== index));
        setColHeaders(newCols);
        setCells(newCells);
        setIsDirty(true);
    };

    const addCol = () => {
        const lastColIndex = colHeaders.length - 1;
        const lastColHeader = colHeaders[lastColIndex];
        const isLastColEmpty = lastColHeader === "Edit me" && cells.every(row => !row[lastColIndex]);

        if (isLastColEmpty) {
            showToast("You have an empty column already");
            return;
        }

        setColHeaders([...colHeaders, "Edit me"]);
        setCells(cells.map(row => [...row, ""]));
        setIsDirty(true);
    };


    // --- Row Logic ---
    const updateRowHeader = (index: number, value: string) => {
        const newRows = [...rowHeaders];
        newRows[index] = value;
        setRowHeaders(newRows);
        setIsDirty(true);
    };

    const deleteRow = (index: number) => {
        if (rowHeaders.length <= 1) return;
        const newRows = rowHeaders.filter((_, i) => i !== index);
        const newCells = cells.filter((_, i) => i !== index);
        setRowHeaders(newRows);
        setCells(newCells);
        setIsDirty(true);
    };

    const addRow = () => {
        const lastRowIndex = rowHeaders.length - 1;
        const lastRowHeader = rowHeaders[lastRowIndex];
        const isLastRowEmpty = lastRowHeader === "Edit me" && cells[lastRowIndex].every(cell => !cell);

        if (isLastRowEmpty) {
            showToast("You have an empty row already");
            return;
        }

        setRowHeaders([...rowHeaders, "Edit me"]);
        setCells([...cells, new Array(colHeaders.length).fill("")]);
        setIsDirty(true);
    };

    // --- Cell Logic ---
    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newCells = [...cells];
        newCells[rowIndex] = [...newCells[rowIndex]]; // Copy row
        newCells[rowIndex][colIndex] = value;
        setCells(newCells);
        setIsDirty(true);
    };


    if (loading) return null; // Or a spinner

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-8">
            <div className="relative w-[80%] h-[80%] bg-white border-4 border-neo-black shadow-neo-lg flex flex-col overflow-hidden">

                {/* Header */}
                <div className={`flex justify-between items-center p-4 border-b-4 border-neo-black shrink-0 ${mode === 'select' ? 'bg-neo-blue' : 'bg-neo-yellow'}`}>
                    <h2 className="text-2xl font-black uppercase text-white">{mode === 'select' ? 'Select Content' : 'Content Matrix'}</h2>
                    <button onClick={handleCloseAttempt} className="neo-button bg-neo-red w-8 h-8 flex items-center justify-center p-0">X</button>
                </div>

                {/* Toast */}
                {toastMessage && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-neo-black text-white px-6 py-2 rounded font-bold shadow-lg z-50 border-2 border-white animate-bounce">
                        {toastMessage}
                    </div>
                )}

                {/* Confirmation Dialog Overlay */}
                {showConfirmDialog && (
                    <div className="absolute inset-0 z-[60] bg-black/20 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white border-4 border-black p-6 shadow-neo-lg max-w-sm w-full">
                            <h3 className="text-xl font-black mb-4">Unsaved Changes</h3>
                            <p className="mb-6 font-bold text-gray-600">Are you sure you want to close without saving?</p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="neo-button bg-neo-green text-center text-white"
                                >
                                    Save and Close
                                </button>
                                <button
                                    onClick={onClose}
                                    className="neo-button bg-neo-red text-center text-white"
                                >
                                    Yes (Discard Changes)
                                </button>
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="neo-button bg-white text-center hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 relative">
                    <div className="inline-flex flex-col">
                        <div className="flex">
                            {/* The Grid */}
                            <div
                                className="grid bg-black border-4 border-black gap-[4px]"
                                style={{
                                    gridTemplateColumns: `150px repeat(${colHeaders.length}, 240px)`,
                                    backgroundColor: '#000' // Gap color
                                }}
                            >
                                {/* Top-Left Empty Cell */}
                                <div className="bg-white p-2 sticky top-0 left-0 z-20"></div>

                                {/* Column Headers */}
                                {colHeaders.map((col, i) => (
                                    <div key={`col-${i}`} className="bg-gray-100 p-2 sticky top-0 z-10 group relative h-16 flex items-center justify-center">
                                        {mode === 'edit' ? (
                                            <input
                                                type="text"
                                                value={col}
                                                onChange={(e) => updateColHeader(i, e.target.value)}
                                                className="w-full bg-transparent font-black text-center outline-none uppercase break-words"
                                            />
                                        ) : (
                                            <div className="w-full bg-transparent font-black text-center uppercase break-words px-1">
                                                {col}
                                            </div>
                                        )}
                                        {mode === 'edit' && (
                                            <button
                                                onClick={() => deleteCol(i)}
                                                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-red-500 hover:bg-red-100 rounded p-1"
                                                title="Delete Column"
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Rows */}
                                {rowHeaders.map((rowHeader, rIndex) => (
                                    <React.Fragment key={`row-${rIndex}`}>
                                        {/* Row Header */}
                                        <div className="bg-gray-100 p-2 sticky left-0 z-10 group relative flex items-center min-h-[120px]">
                                            {mode === 'edit' ? (
                                                <input
                                                    type="text"
                                                    value={rowHeader}
                                                    onChange={(e) => updateRowHeader(rIndex, e.target.value)}
                                                    className="w-full bg-transparent font-black text-left outline-none"
                                                />
                                            ) : (
                                                <div className="w-full bg-transparent font-black text-left">
                                                    {rowHeader}
                                                </div>
                                            )}
                                            {mode === 'edit' && (
                                                <button
                                                    onClick={() => deleteRow(rIndex)}
                                                    className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-red-500 hover:bg-red-100 rounded p-1"
                                                    title="Delete Row"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>

                                        {/* Cells */}
                                        {cells[rIndex].map((cell, cIndex) => (
                                            <div
                                                key={`cell-${rIndex}-${cIndex}`}
                                                className={`bg-white p-0 relative ${mode === 'select'
                                                    ? cell
                                                        ? 'cursor-pointer hover:bg-neo-blue hover:text-white transition-colors'
                                                        : 'cursor-not-allowed bg-gray-50'
                                                    : ''
                                                    }`}
                                                onClick={() => {
                                                    if (mode === 'select' && cell && onSelect) {
                                                        onSelect(rIndex, cIndex, cell);
                                                    }
                                                }}
                                            >
                                                {mode === 'edit' ? (
                                                    <textarea
                                                        value={cell}
                                                        onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                                                        className="w-full h-full p-2 resize-none outline-none focus:bg-yellow-50 text-sm"
                                                        placeholder="..."
                                                    />
                                                ) : (
                                                    <div className="w-full h-full p-2 text-sm overflow-y-auto max-h-[150px]">
                                                        {cell}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Add Column Trigger Area (Right of grid) */}
                            <div className="w-12 ml-1 flex flex-col hover:bg-gray-100 transition-colors group cursor-pointer border-l-2 border-dashed border-transparent hover:border-gray-300"
                                onClick={addCol}
                            >
                                <div className="mt-16 w-full h-full flex items-center justify-center group-hover:opacity-100 opacity-0 text-gray-400 font-bold">
                                    <span className="rotate-90 whitespace-nowrap">Add Col</span>
                                </div>
                            </div>
                        </div>

                        {/* Add Row Trigger Area (Bottom of grid) */}
                        <div className="h-12 mt-1 flex hover:bg-gray-100 transition-colors group cursor-pointer border-t-2 border-dashed border-transparent hover:border-gray-300"
                            onClick={addRow}
                        >
                            <div className="ml-[150px] w-full flex items-center justify-center group-hover:opacity-100 opacity-0 text-gray-400 font-bold">
                                <span>Add Row</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Save Action */}
                {mode === 'edit' && (
                    <div className="p-4 border-t-4 border-black bg-gray-50 flex justify-end">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={!isDirty}
                            className="neo-button bg-neo-blue text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MatrixModal;
