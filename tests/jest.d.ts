/// <reference types="@types/jest" />

declare namespace jest {
    interface Mock<T = any, Y extends any[] = any, C = any> extends Function {
        mockReturnValue: (val: any) => Mock;
        mockResolvedValue: (val: any) => Mock;
        mockReturnThis: () => Mock;
        mockImplementation: (fn: (...args: any[]) => any) => Mock;
    }
}
