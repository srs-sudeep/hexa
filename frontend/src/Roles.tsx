import React, { useEffect, useState } from 'react';
import { api } from './api';
import './Dashboard.css';

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  created_at: string;
}

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const availablePermissions = ['read', 'write', 'delete', 'admin', 'user_management'];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/roles', newRole);
      setNewRole({ name: '', description: '', permissions: [] });
      setShowForm(false);
      fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handlePermissionChange = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.indexOf(permission) !== -1
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (loading) return <div className="loading">Loading roles...</div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Roles & Permissions</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Role'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Create New Role</h3>
          <form onSubmit={handleCreateRole}>
            <div className="form-group">
              <label>Role Name:</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                required
                placeholder="e.g., Admin, User, Manager"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newRole.description}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Permissions:</label>
              <div className="permissions-grid">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={newRole.permissions.indexOf(permission) !== -1}
                      onChange={() => handlePermissionChange(permission)}
                    />
                    <span className="permission-name">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary">Create Role</button>
          </form>
        </div>
      )}

      <div className="users-list">
        <h3>All Roles ({roles.length})</h3>
        {roles.length === 0 ? (
          <p>No roles found. Create your first role!</p>
        ) : (
          <div className="roles-grid">
            {roles.map((role) => (
              <div key={role.id} className="role-card">
                <h4>{role.name}</h4>
                {role.description && <p className="description">{role.description}</p>}
                {role.permissions && role.permissions.length > 0 && (
                  <div className="permissions">
                    <strong>Permissions:</strong>
                    <div className="permission-tags">
                      {role.permissions.map((permission) => (
                        <span key={permission} className="permission-tag">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="created-at">
                  Created: {new Date(role.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
