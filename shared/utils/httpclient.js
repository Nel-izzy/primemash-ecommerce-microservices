const axios = require('axios');
const logger = require('./logger');

class HttpClient {
  constructor(baseURL, serviceName) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.serviceName = serviceName;

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Calling ${this.serviceName}`, {
          method: config.method.toUpperCase(),
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error(`Request error to ${this.serviceName}`, { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Response from ${this.serviceName}`, {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error(`Error response from ${this.serviceName}`, {
            status: error.response.status,
            url: error.config.url,
            data: error.response.data
          });
        } else if (error.request) {
          logger.error(`No response from ${this.serviceName}`, {
            url: error.config.url,
            message: error.message
          });
        } else {
          logger.error(`Request setup error for ${this.serviceName}`, {
            message: error.message
          });
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      throw new Error(
        error.response.data.message || 
        `${this.serviceName} responded with status ${error.response.status}`
      );
    } else if (error.request) {
      // No response received
      throw new Error(`${this.serviceName} is unavailable`);
    } else {
      // Request setup error
      throw new Error(error.message);
    }
  }
}

module.exports = HttpClient;