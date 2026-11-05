/**
 * NexusGGR Games API & Seamless Integration Client
 * Official Endpoint: https://api.nexusggr.com
 * Documentation: https://my.nexusggr.com/app/docs/integration/game-api
 */

class NexusClient {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.NEXUSGGR_API_URL || 'https://api.nexusggr.com';
    this.agentCode = options.agentCode || process.env.NEXUSGGR_AGENT_CODE || '';
    this.agentToken = options.agentToken || process.env.NEXUSGGR_AGENT_TOKEN || '';
    this.timeout = options.timeout || 12000;
  }

  isConfigured() {
    return Boolean(this.agentCode && this.agentToken);
  }

  /**
   * Universal POST request to NexusGGR API
   * @param {Object} payload 
   */
  async request(payload = {}) {
    const body = {
      agent_code: this.agentCode,
      agent_token: this.agentToken,
      ...payload
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const json = await response.json();
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[NexusClient] Request failed:', err.message);
      return {
        status: 0,
        code: 7770500,
        msg: err.name === 'AbortError' ? 'NexusGGR Gateway Timeout' : err.message
      };
    }
  }

  /**
   * Launch Game (Method: game_launch)
   * @param {Object} params
   * @param {string} params.userCode - Unique user ID on WinX
   * @param {string} params.providerCode - Provider e.g. PRAGMATIC, JILI, PGSOFT, EVOLUTION
   * @param {string} [params.gameCode] - Specific game ID (or empty for provider lobby)
   * @param {string} [params.lang] - ISO Language code (default 'en')
   */
  async gameLaunch({ userCode, providerCode, gameCode = '', lang = 'en' }) {
    if (!userCode || !providerCode) {
      return {
        status: 0,
        code: 7770405,
        msg: 'userCode and providerCode are required'
      };
    }

    return await this.request({
      method: 'game_launch',
      user_code: String(userCode),
      provider_code: String(providerCode).toUpperCase(),
      game_code: String(gameCode || ''),
      lang: lang || 'en'
    });
  }

  /**
   * Fetch Game Catalog (Method: game_list)
   * @param {Object} [params]
   * @param {string} [params.providerCode] - Filter by provider (optional)
   */
  async getGameList({ providerCode = '' } = {}) {
    const payload = { method: 'game_list' };
    if (providerCode) {
      payload.provider_code = String(providerCode).toUpperCase();
    }
    return await this.request(payload);
  }

  /**
   * Fetch Supported Providers (Method: provider_list)
   */
  async getProviderList() {
    return await this.request({
      method: 'provider_list'
    });
  }

  /**
   * Check Agent Balance and Credit Info (Method: money_info)
   */
  async getMoneyInfo() {
    return await this.request({
      method: 'money_info'
    });
  }

  /**
   * Create/Register User (Method: user_create)
   * @param {string} userCode 
   */
  async createUser(userCode) {
    return await this.request({
      method: 'user_create',
      user_code: String(userCode)
    });
  }

  /**
   * Get User Balance on Nexus side if applicable (Method: user_balance)
   * @param {string} userCode 
   */
  async getUserBalance(userCode) {
    return await this.request({
      method: 'user_balance',
      user_code: String(userCode)
    });
  }
}

export const nexusClient = new NexusClient();
export default NexusClient;
