# React Native 모바일 규칙

## React Native 규칙

### 네이티브 컴포넌트
- **네이티브 전용**: WebView에 임베드되지 않는 네이티브 UI만 사용
- **WebView 통신**: `react-native-webview`의 `postMessage` API 사용

### WebView 브릿지
- **타입 안전한 통신**: 메시지 타입 정의 필수
- **에러 핸들링**: 네이티브 ↔ 웹 통신 에러 처리

### 예시
```typescript
import { WebView } from 'react-native-webview';

type WebViewMessage = {
  type: 'REQUEST_MIC_PERMISSION' | 'AUDIO_DATA';
  data?: unknown;
};

export function App() {
  const handleMessage = (event: WebViewMessageEvent) => {
    const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
    
    switch (message.type) {
      case 'REQUEST_MIC_PERMISSION':
        // 네이티브 권한 처리
        break;
    }
  };

  return (
    <WebView
      source={{ uri: process.env.EXPO_PUBLIC_WEB_URL || 'https://...' }}
      onMessage={handleMessage}
    />
  );
}
```

## 성능 최적화

### React Native
- **WebView 캐싱**: 적절한 캐싱 전략 구현
- **번들 최적화**: Metro bundler 설정 최적화
