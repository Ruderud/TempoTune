#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(MetronomeModule, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(double)bpm beatsPerMeasure:(int)beatsPerMeasure accentFirst:(BOOL)accentFirst)
RCT_EXTERN_METHOD(stop)
RCT_EXTERN_METHOD(setBpm:(double)bpm)
RCT_EXTERN_METHOD(setTimeSignature:(int)beatsPerMeasure)

@end
