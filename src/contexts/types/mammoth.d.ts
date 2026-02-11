declare module 'mammoth' {
    export interface ConvertOptions {
        arrayBuffer?: ArrayBuffer;
        path?: string;
        buffer?: Buffer;
    }

    export interface ConvertResult {
        value: string; // The generated HTML
        messages: any[]; // Any messages, such as warnings during conversion
    }

    export function convertToHtml(options: ConvertOptions): Promise<ConvertResult>;
    export function extractRawText(options: ConvertOptions): Promise<ConvertResult>;
}
