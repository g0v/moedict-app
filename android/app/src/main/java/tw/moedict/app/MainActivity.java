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

        // Android 返回鍵／邊緣返回手勢：有上一頁時返回，無上一頁時結束 Activity
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
                    bridge.getWebView().goBack();
                } else {
                    finish();
                }
            }
        });
    }
}
