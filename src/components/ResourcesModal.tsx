import React, { useState, useEffect } from 'react';
import { Resource } from '@/types/resource';
import { getResources, addResource, deleteResource } from '@/services/resourceService';
import { useAuth } from './AuthContext';

interface ResourcesModalProps {
    onClose: () => void;
}

const ResourcesModal: React.FC<ResourcesModalProps> = ({ onClose }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchResources = async () => {
            if (user) {
                const data = await getResources(user.uid);
                setResources(data);
            }
            setLoading(false);
        };
        fetchResources();
    }, [user]);

    const handleAdd = async () => {
        if (!user || !newResourceTitle.trim()) return;

        const added = await addResource(user.uid, newResourceTitle, newResourceUrl);
        if (added) {
            setResources([...resources, added]);
            setNewResourceTitle('');
            setNewResourceUrl('');
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        const success = await deleteResource(user.uid, id);
        if (success) {
            setResources(resources.filter(r => r.id !== id));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
             <div className="bg-white border-4 border-neo-black shadow-neo-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b-4 border-black flex justify-between items-center bg-neo-yellow">
                    <h2 className="text-2xl font-black uppercase tracking-wider">Resources</h2>
                    <button 
                        onClick={onClose}
                        className="neo-button bg-neo-pink p-2 flex items-center justify-center border-2 border-black hover:bg-red-400 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* List */}
                    {loading ? (
                        <div className="text-center font-bold py-8">Loading resources...</div>
                    ) : resources.length === 0 ? (
                        <div className="text-center text-gray-500 font-bold py-8 italic border-2 border-dashed border-gray-300">
                            No resources yet. Add one below!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 mb-6">
                            {resources.map((resource) => (
                                <div key={resource.id} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white border-2 border-black p-3 shadow-neo-sm hover:translate-y-[-2px] hover:shadow-neo transition-all">
                                    <div className="flex-1">
                                        <div className="font-bold text-lg">{resource.title}</div>
                                        {resource.url && (
                                            <a 
                                                href={resource.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline text-sm font-medium hover:text-blue-800 truncate block"
                                            >
                                                {resource.url}
                                            </a>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(resource.id)}
                                        className="self-end sm:self-auto text-black border-2 border-transparent hover:border-black hover:bg-red-100 transition-all p-2 flex items-center justify-center cursor-pointer group"
                                        title="Delete Resource"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-red-500 transition-colors">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New */}
                    <div className="border-t-4 border-black pt-6 mt-2">
                        <h3 className="font-black uppercase mb-3">Add New Resource</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Resource Title (e.g. Design Assets)"
                                value={newResourceTitle}
                                onChange={(e) => setNewResourceTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="neo-input w-full font-bold"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="URL (Optional)"
                                    value={newResourceUrl}
                                    onChange={(e) => setNewResourceUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="neo-input flex-1 font-medium text-sm"
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!newResourceTitle.trim()}
                                    className="neo-button bg-neo-green px-6 font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
             </div>
        </div>
    );
};

export default ResourcesModal;
