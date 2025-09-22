import axios, { AxiosInstance } from 'axios';
import { FormData } from 'formdata-node';

export class TestClient {
  private client: AxiosInstance;
  private documentsCreated: string[] = [];

  constructor(baseURL: string, authToken?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${authToken || process.env.TEST_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async post(path: string, data: any): Promise<any> {
    if (path.includes('/documents') && data.file) {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.metadata) {
        formData.append('metadata', JSON.stringify(data.metadata));
      }
      const response = await this.client.post(path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data?.id) {
        this.documentsCreated.push(response.data.id);
      }
      return response;
    }
    return this.client.post(path, data);
  }

  async get(path: string, config?: any): Promise<any> {
    return this.client.get(path, config);
  }

  async patch(path: string, data: any): Promise<any> {
    return this.client.patch(path, data);
  }

  async cleanup(): Promise<void> {
    // Delete any documents created during tests
    await Promise.all(
      this.documentsCreated.map(id =>
        this.client.delete(`/api/v1/documents/${id}`).catch(() => {})
      )
    );
    this.documentsCreated = [];
  }
}