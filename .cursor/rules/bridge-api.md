# Bridge API 패턴

## 아키텍처 원칙
Native API를 사용하기 위한 Bridge API는 **의존성 역전 원칙(DIP)**을 따릅니다:
- **인터페이스 정의**: `packages/shared/src/bridge/`에 Bridge API 인터페이스 정의
- **구현**: `apps/mobile/src/bridge/`에서 인터페이스 구현
- **사용**: `apps/web`에서 인터페이스를 라이브러리처럼 사용

## 패턴 구조

```
packages/shared/src/bridge/
├── native-bridge.types.ts      # Bridge API 타입 정의
├── audio-bridge.interface.ts   # 오디오 Bridge 인터페이스
└── index.ts                    # Export

apps/mobile/src/bridge/
├── audio-bridge.impl.ts        # 오디오 Bridge 구현
└── native-bridge.service.ts    # Bridge 서비스 구현

apps/web/services/bridge/
├── audio-bridge.client.ts      # 웹에서 Bridge 사용
└── bridge-adapter.ts           # Bridge 어댑터
```

## 인터페이스 정의 (packages/shared)

**원칙**:
- 모든 Bridge API 인터페이스는 `packages/shared/src/bridge/`에 정의
- 타입 안전성을 위해 TypeScript `type` 또는 `interface` 사용
- 플랫폼 독립적인 추상화 제공

**예시**:
```typescript
// packages/shared/src/bridge/audio-bridge.interface.ts
export type AudioPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type AudioBridgeRequest = {
  type: 'REQUEST_MIC_PERMISSION' | 'START_RECORDING' | 'STOP_RECORDING';
  data?: unknown;
};

export type AudioBridgeResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type AudioBridgeInterface = {
  requestPermission(): Promise<AudioPermissionStatus>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<AudioBridgeResponse>;
  onAudioData(callback: (data: unknown) => void): void;
};
```

## 구현 (apps/mobile)

**원칙**:
- `apps/mobile/src/bridge/`에서 인터페이스 구현
- React Native의 네이티브 모듈과 통신
- WebView를 통해 웹으로 메시지 전달

**예시**:
```typescript
// apps/mobile/src/bridge/audio-bridge.impl.ts
import type { AudioBridgeInterface, AudioPermissionStatus } from '@tempo-tune/shared/bridge';
import { PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

export class AudioBridgeImpl implements AudioBridgeInterface {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private webViewRef: React.RefObject<WebView>;

  constructor(webViewRef: React.RefObject<WebView>) {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.webViewRef = webViewRef;
  }

  async requestPermission(): Promise<AudioPermissionStatus> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    }
    // iOS 권한 처리
    return 'granted';
  }

  async startRecording(): Promise<void> {
    const result = await this.audioRecorderPlayer.startRecorder();
    console.log('!!DEBUG [AudioBridgeImpl.startRecording] result:', result);
  }

  async stopRecording(): Promise<AudioBridgeResponse> {
    const result = await this.audioRecorderPlayer.stopRecorder();
    return {
      success: true,
      data: result,
    };
  }

  onAudioData(callback: (data: unknown) => void): void {
    // 오디오 데이터 콜백 처리
  }
}
```

## 사용 (apps/web)

**원칙**:
- `apps/web`은 인터페이스만 import하여 사용
- 구현 세부사항에 의존하지 않음
- WebView의 `postMessage`를 통해 네이티브와 통신

**예시**:
```typescript
// apps/web/services/bridge/audio-bridge.client.ts
import type { AudioBridgeInterface, AudioPermissionStatus } from '@tempo-tune/shared/bridge';

export class AudioBridgeClient implements AudioBridgeInterface {
  private isNative: boolean;

  constructor() {
    this.isNative = typeof window !== 'undefined' && 
                    'ReactNativeWebView' in window;
  }

  async requestPermission(): Promise<AudioPermissionStatus> {
    if (!this.isNative) {
      // 웹 환경에서는 Web Audio API 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    }

    // 네이티브 환경에서는 WebView를 통해 요청
    return new Promise((resolve) => {
      const message = {
        type: 'REQUEST_MIC_PERMISSION',
      };

      window.ReactNativeWebView?.postMessage(JSON.stringify(message));

      // 응답 리스너 등록
      const handleMessage = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.type === 'MIC_PERMISSION_RESPONSE') {
          window.removeEventListener('message', handleMessage);
          resolve(response.status);
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  async startRecording(): Promise<void> {
    if (!this.isNative) {
      // 웹 환경 구현
      return;
    }

    const message = { type: 'START_RECORDING' };
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  }

  async stopRecording() {
    // 구현...
  }

  onAudioData(callback: (data: unknown) => void): void {
    // 구현...
  }
}
```

## 규칙 요약

1. **인터페이스 우선**: 모든 Bridge API는 먼저 `packages/shared`에 인터페이스 정의
2. **구현 분리**: 구현은 각 플랫폼(`apps/mobile`, `apps/web`)에서 담당
3. **타입 안전성**: TypeScript로 계약(contract) 명확히 정의
4. **의존성 방향**: `apps/web` → `packages/shared` ← `apps/mobile` (양방향 의존 없음)
5. **테스트 용이성**: 인터페이스를 모킹하여 각 플랫폼 독립적으로 테스트 가능

## 파일 네이밍

- **인터페이스**: `*-bridge.interface.ts` 또는 `*-bridge.types.ts`
- **구현**: `*-bridge.impl.ts` (mobile), `*-bridge.client.ts` (web)
- **서비스**: `*-bridge.service.ts`
