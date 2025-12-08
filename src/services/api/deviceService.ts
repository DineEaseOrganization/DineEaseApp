import {apiClient} from './apiClient';
import {API_CONFIG} from '../../config/api.config';
import {DeviceActionResponse, DeviceListResponse, TrustDeviceRequest,} from '../../types/api.types';

class DeviceService {
  /**
   * Get list of all user devices
   */
  async listDevices(): Promise<DeviceListResponse> {
    return await apiClient.get<DeviceListResponse>(
      API_CONFIG.ENDPOINTS.LIST_DEVICES
    );
  }

  /**
   * Remove a device
   */
  async removeDevice(deviceId: string): Promise<DeviceActionResponse> {
    return await apiClient.delete<DeviceActionResponse>(
      `${API_CONFIG.ENDPOINTS.REMOVE_DEVICE}/${deviceId}`
    );
  }

  /**
   * Update device trust status
   */
  async updateDeviceTrust(
    deviceId: string,
    trusted: boolean
  ): Promise<DeviceActionResponse> {
    const request: TrustDeviceRequest = {trusted};

    return await apiClient.put<DeviceActionResponse>(
      `${API_CONFIG.ENDPOINTS.UPDATE_DEVICE_TRUST}/${deviceId}/trust`,
      request
    );
  }
}

// Export singleton instance
export const deviceService = new DeviceService();

// Export class for testing or advanced usage
export {DeviceService};