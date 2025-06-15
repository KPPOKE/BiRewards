import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import { Tag, Plus, X, Save } from 'lucide-react';

// Flag to disable automatic API calls in development to prevent infinite loops
const DISABLE_AUTO_REFRESH = false;

interface TagItem {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CustomerTagsProps {
  userId: string;
  onTagsChange?: () => void;
}

const CustomerTags: React.FC<CustomerTagsProps> = ({ userId, onTagsChange }) => {
  const { currentUser } = useAuth();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Ref to track initial load to prevent infinite loops
  const initialLoadDone = useRef(false);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  


  // Fetch user's tags
  const fetchUserTags = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`http://localhost:3000/api/customers/users/${userId}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err: unknown) {
      let message = 'Failed to load user tags';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error fetching user tags:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch all available tags
  const fetchAllTags = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/customers/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAllTags(data.tags || []);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err: unknown) {
      let message = 'Failed to load all tags';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error fetching all tags:', err);
      setError(message);
    }
  };

  // Create a new tag
  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsCreatingTag(true);
      const res = await fetch('http://localhost:3000/api/customers/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: newTagDescription.trim()
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setAllTags(prev => [...prev, data.tag]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setNewTagDescription('');
      setIsAdding(false);
    } catch (err: unknown) {
      let message = 'Failed to create tag';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error creating tag:', err);
      setError(message);
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Add tags to user
  const addTagsToUser = async () => {
    if (selectedTagIds.length === 0) {
      setShowTagSelector(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/customers/users/${userId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tagIds: selectedTagIds
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setTags(data.tags || []);
      setShowTagSelector(false);
      setSelectedTagIds([]);
      if (onTagsChange) onTagsChange();
    } catch (err: unknown) {
      let message = 'Failed to add tags';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error adding tags to user:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Remove tag from user
  const removeTag = async (tagId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/customers/users/${userId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      setTags(prev => prev.filter(tag => tag.id !== tagId));
      if (onTagsChange) onTagsChange();
    } catch (err: unknown) {
      let message = 'Failed to remove tag';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error removing tag:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle tag selection
  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  useEffect(() => {
    if (!DISABLE_AUTO_REFRESH) {
      fetchUserTags();
      fetchAllTags();
    } else {
      // Only fetch on initial load
      if (!initialLoadDone.current) {
        fetchUserTags();
        fetchAllTags();
        initialLoadDone.current = true;
      }
    }
  }, [userId, fetchUserTags]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Customer Tags</h3>
        {!showTagSelector && (
          <button 
            onClick={() => setShowTagSelector(true)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Tags
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 p-2 m-2 rounded-md">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      
      <div className="p-4">
        {/* Display current tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.length === 0 ? (
            <p className="text-sm text-gray-500">No tags assigned to this customer yet.</p>
          ) : (
            tags.map(tag => (
              <div 
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
                <button 
                  onClick={() => removeTag(tag.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Tag selector */}
        {showTagSelector && (
          <div className="border border-gray-200 rounded-md p-3 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">Select tags to add</h4>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                {isAdding ? 'Cancel' : 'Create New Tag'}
              </button>
            </div>
            
            {isAdding ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="tagName" className="block text-xs font-medium text-gray-700">Tag Name</label>
                  <input
                    type="text"
                    id="tagName"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter tag name"
                  />
                </div>
                <div>
                  <label htmlFor="tagColor" className="block text-xs font-medium text-gray-700">Color</label>
                  <div className="flex items-center mt-1">
                    <input
                      type="color"
                      id="tagColor"
                      value={newTagColor}
                      onChange={e => setNewTagColor(e.target.value)}
                      className="h-8 w-8 border border-gray-300 rounded-md shadow-sm"
                    />
                    <span className="ml-2 text-xs text-gray-500">{newTagColor}</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="tagDescription" className="block text-xs font-medium text-gray-700">Description (optional)</label>
                  <input
                    type="text"
                    id="tagDescription"
                    value={newTagDescription}
                    onChange={e => setNewTagDescription(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter description"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={createTag}
                    disabled={!newTagName.trim() || isCreatingTag}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isCreatingTag ? 'Creating...' : 'Create Tag'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="max-h-40 overflow-y-auto mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {allTags
                      .filter(tag => !tags.some(t => t.id === tag.id))
                      .map(tag => (
                        <div 
                          key={tag.id}
                          className={`flex items-center p-2 rounded-md cursor-pointer ${
                            selectedTagIds.includes(tag.id) 
                              ? 'bg-primary-50 border border-primary-200' 
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                          onClick={() => toggleTagSelection(tag.id)}
                        >
                          <div 
                            className="h-3 w-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <span className="text-xs font-medium text-gray-700">{tag.name}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowTagSelector(false)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTagsToUser}
                    disabled={selectedTagIds.length === 0 || loading}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {loading ? 'Saving...' : 'Save Tags'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

}

export default CustomerTags;
