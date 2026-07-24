export class ApiResponse<T = unknown> {
  constructor(
    public success: boolean,
    public message: string,
    public data?: T,
    public errors?: string[],
  ) {}

  static success<T>(message: string, data?: T) {
    return new ApiResponse(true, message, data);
  }

  static error(message: string, errors?: string[]) {
    return new ApiResponse(false, message, undefined, errors);
  }
}