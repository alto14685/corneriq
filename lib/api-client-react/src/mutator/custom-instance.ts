import axios, { AxiosRequestConfig } from "axios";

// baseURL is set by the consuming app (main.tsx) at startup via axiosInstance.defaults.baseURL
export const axiosInstance = axios.create({
  baseURL: "http://localhost:3001",
});

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = axiosInstance({ ...config, cancelToken: source.token }).then(
    ({ data }) => data,
  );
  (promise as any).cancel = () => source.cancel("Query was cancelled");
  return promise;
};

export default customInstance;
