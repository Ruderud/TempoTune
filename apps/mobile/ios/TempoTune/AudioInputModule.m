#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioInputModule, RCTEventEmitter)

RCT_EXTERN_METHOD(listInputDevices)
RCT_EXTERN_METHOD(getSelectedInputDevice)
RCT_EXTERN_METHOD(selectInputDevice:(NSString *)deviceId)
RCT_EXTERN_METHOD(startCapture:(NSDictionary *)config)
RCT_EXTERN_METHOD(configureAnalyzers:(NSDictionary *)config)
RCT_EXTERN_METHOD(setQaSampleSource:(NSDictionary *)config)
RCT_EXTERN_METHOD(clearQaSampleSource)
RCT_EXTERN_METHOD(stopCapture)

@end
