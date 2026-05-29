package tw.moedict.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 鎖定 WebView 字級縮放為 100%，防止 Android 系統字級設定壓板導航列 (fixes #114)
        WebSettings settings = this.bridge.getWebView().getSettings();
        settings.setTextZoom(100);

        // 攔截 Android 邊緣返回手勢，避免在 WebView 無上一頁時直接退出 App
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
                    bridge.getWebView().goBack();
                }
            }
        });
    }
}
