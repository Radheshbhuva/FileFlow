export interface RealtimeProvider {
  /**
   * Establishes the provider connection or starts the server listener.
   */
  connect(): Promise<void>;

  /**
   * Closes connections and clean up resources.
   */
  disconnect(): Promise<void>;

  /**
   * Publishes/broadcasts a message to a specific channel.
   */
  publish(channel: string, message: any): Promise<void>;

  /**
   * Registers a callback handler for events on a channel.
   */
  subscribe(channel: string, handler: (message: any) => void): Promise<void>;

  /**
   * Removes a callback handler from a channel.
   */
  unsubscribe(channel: string, handler: (message: any) => void): Promise<void>;
}
