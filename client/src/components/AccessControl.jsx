import { useState, useEffect } from 'react'
import './AccessControl.css'

function AccessControl() {
  const [guilds, setGuilds] = useState([])
  const [allowedRoles, setAllowedRoles] = useState([])
  const [selectedGuild, setSelectedGuild] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [guildsRes, rolesRes] = await Promise.all([
        fetch('/api/admin/discord/guilds', { credentials: 'include' }),
        fetch('/api/admin/roles', { credentials: 'include' })
      ])

      if (guildsRes.ok) {
        const guildsData = await guildsRes.json()
        setGuilds(guildsData)
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setAllowedRoles(rolesData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRole = async () => {
    if (!selectedGuild || !selectedRole) return

    const guild = guilds.find(g => g.id === selectedGuild)
    const role = guild?.roles.find(r => r.id === selectedRole)

    if (!guild || !role) return

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          guildId: guild.id,
          roleId: role.id,
          roleName: role.name
        })
      })

      if (response.ok) {
        await loadData()
        setSelectedRole('')
      }
    } catch (error) {
      console.error('Failed to add role:', error)
    }
  }

  const handleRemoveRole = async (guildId, roleId) => {
    try {
      const response = await fetch(`/api/admin/roles/${guildId}/${roleId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Failed to remove role:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const selectedGuildData = guilds.find(g => g.id === selectedGuild)

  return (
    <div className="access-control">
      <div className="card">
        <h2>Add Allowed Role</h2>
        <p className="section-description">
          Users with the selected role will have access to unlock the door.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Select Server</label>
            <select 
              className="select"
              value={selectedGuild}
              onChange={(e) => {
                setSelectedGuild(e.target.value)
                setSelectedRole('')
              }}
            >
              <option value="">Choose a server...</option>
              {guilds.map(guild => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          </div>

          {selectedGuildData && (
            <div className="form-group">
              <label>Select Role</label>
              <select 
                className="select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Choose a role...</option>
                {selectedGuildData.roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleAddRole}
          disabled={!selectedGuild || !selectedRole}
        >
          Add Role
        </button>
      </div>

      <div className="card">
        <h2>Allowed Roles</h2>
        {allowedRoles.length === 0 ? (
          <p className="empty-state">No roles have been added yet.</p>
        ) : (
          <div className="roles-list">
            {allowedRoles.map(role => {
              const guild = guilds.find(g => g.id === role.guild_id)
              return (
                <div key={`${role.guild_id}-${role.role_id}`} className="role-item">
                  <div className="role-info">
                    <div className="role-name">{role.role_name}</div>
                    <div className="role-guild">{guild?.name || 'Unknown Server'}</div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveRole(role.guild_id, role.role_id)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccessControl
