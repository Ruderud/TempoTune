import React from 'react';
import {Platform, SafeAreaView, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

// iOS 시뮬레이터: localhost
// Android 에뮬레이터: 10.0.2.2
// 실제 디바이스: 개발 머신의 IP 주소
// 실제 디바이스에서 사용 시 아래 IP를 개발 머신의 실제 IP로 변경하세요
const DEV_MACHINE_IP = '172.30.1.55'; // 개발 머신의 로컬 IP 주소

// 실제 디바이스인지 확인 (시뮬레이터는 localhost를 사용)
const getWebUrl = (): string => {
  if (!__DEV__) {
    return 'https://your-production-url.com';
  }

  if (Platform.OS === 'ios') {
    // iOS의 경우, 실제 디바이스에서는 개발 머신의 IP를 사용
    // 시뮬레이터에서는 localhost 사용
    // 실제 디바이스에서 실행 시 아래 주석을 해제하세요
    return `http://${DEV_MACHINE_IP}:3000`; // 실제 디바이스용
    // return 'http://localhost:3000'; // 시뮬레이터용
  } else {
    // Android 에뮬레이터
    return 'http://10.0.2.2:3000';
  }
};

const WEB_URL = getWebUrl();

function App(): React.JSX.Element {
  const handleMessage = (event: any) => {
    console.log('!!DEBUG [App.handleMessage] message:', event.nativeEvent.data);
    // Bridge API 메시지 처리
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{uri: WEB_URL}}
        onMessage={handleMessage}
        style={styles.webview}
        injectedJavaScript={`
          window.ReactNativeWebView = window.ReactNativeWebView || {};
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default App;
