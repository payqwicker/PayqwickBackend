const { fetchActiveSessions, revokeSession } = require("../services/redisService");

  
  // Controller to fetch active sessions/devices for the user
  const getActiveSessions = async (req, res) => {
    const { userId } = req.params;
    try {
      const activeSessions = await fetchActiveSessions(userId);
      res.json({ activeSessions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
  };
  
  // Controller to revoke a specific session/device
  const deleteSession = async (req, res) => {
    const { userId, deviceId } = req.params;
    try {
      await revokeSession(userId, deviceId);
      res.json({ message: `Session for device ${deviceId} revoked successfully` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to revoke session' });
    }
  };
  
  module.exports = {
    getActiveSessions,
    deleteSession,
  };
  