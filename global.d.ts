declare global {
    interface GlobalThis {
        /**
         * Registers a JavaScript module under a given name.
         * Throws an error if the module is already registered.
         *
         * @param moduleName - The name of the module to register.
         * @param moduleFunctions - An object containing functions to be registered.
         * 
         * @throws {Error} If the module is already registered.
         */
        registerJSModule(moduleName: string, moduleFunctions: Record<string, Function>): void;

        /**
         * Sends data back to Dart from JavaScript.
         *
         * @param callbackId - A unique identifier for the callback.
         * @param data - The data to send.
         */
        send_to_dart(callbackId: number, data: any): boolean;
    }
}

/**
 * Registers a JavaScript module under a given name.
 * Throws an error if the module is already registered.
 *
 * @param moduleName - The name of the module to register.
 * @param moduleFunctions - An object containing functions to be registered.
 * 
 * @throws {Error} If the module is already registered.
 */
declare function registerJSModule(moduleName: string, moduleFunctions: Record<string, Function>): void;

/**
 * Sends data back to Dart from JavaScript.
 *
 * @param callbackId - A unique identifier for the callback.
 * @param data - The data to send.
 */
declare function send_to_dart(callbackId: number, data: any): boolean;

export { };