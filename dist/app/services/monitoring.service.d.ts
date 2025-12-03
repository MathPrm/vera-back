interface MonitoringData {
    url: string;
    chatId: string;
    userId: string;
}
declare class MonitoringService {
    private isRunning;
    private monitoringInterval;
    processVideoCheck(data: MonitoringData): Promise<{
        success: boolean;
        videoData?: any;
        verificationResult?: any;
    }>;
    addVideoCheck(url: string, chatId: string, userId: string): Promise<{
        success: boolean;
        videoData?: any;
        verificationResult?: any;
    }>;
    startPeriodicMonitoring(): Promise<void>;
    stopPeriodicMonitoring(): void;
    sleep(ms: number): Promise<void>;
}
declare const _default: MonitoringService;
export default _default;
//# sourceMappingURL=monitoring.service.d.ts.map