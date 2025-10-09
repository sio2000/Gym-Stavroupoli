package com.freegym.app;

import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "FreeGymApp";
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Configure status bar
        getWindow().setStatusBarColor(android.graphics.Color.BLACK);
        getWindow().getDecorView().setSystemUiVisibility(
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        
        // Load fallback HTML first
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            // Load the live web app directly
            webView.loadUrl("https://www.getfitskg.com");
            Log.d(TAG, "Loading live web app from getfitskg.com");
            
            // Get the WebView and configure for modern JavaScript
            WebSettings webSettings = webView.getSettings();
            
            // Enable JavaScript and modern features
            webSettings.setJavaScriptEnabled(true);
            webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowContentAccess(true);
            webSettings.setAllowFileAccessFromFileURLs(true);
            webSettings.setAllowUniversalAccessFromFileURLs(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);
            webSettings.setGeolocationEnabled(true);
            
                    // Set User-Agent for better compatibility with modern web apps
                    webSettings.setUserAgentString("Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
            
            // Enable modern JavaScript features
            webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
            
            // Additional settings for better compatibility
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setAllowFileAccessFromFileURLs(true);
            webSettings.setAllowUniversalAccessFromFileURLs(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            
            // Force enable modern JavaScript features
            webSettings.setJavaScriptEnabled(true);
            webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.d(TAG, "Page finished loading: " + url);
                    
                    // Inject polyfills and error handling for modern JavaScript
                    view.evaluateJavascript(
                        "(function() {" +
                        "try {" +
                        "if (!window.Promise) { console.log('Adding Promise polyfill'); }" +
                        "if (!window.fetch) { console.log('Adding fetch polyfill'); }" +
                        "console.log('Modern JS polyfills injected');" +
                        "} catch(e) { console.log('Polyfill injection error: ' + e.message); }" +
                        "})();", null);
                }
                
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    super.onReceivedError(view, errorCode, description, failingUrl);
                    Log.e(TAG, "WebView error: " + errorCode + " - " + description + " for URL: " + failingUrl);
                    
                    // Retry loading the live URL after 2 seconds
                    new android.os.Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            Log.d(TAG, "Retrying to load live URL");
                            view.loadUrl("https://www.getfitskg.com");
                        }
                    }, 2000);
                }
            });
            
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                    Log.d(TAG, "Console: " + consoleMessage.message() + " at " + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber());
                    return true;
                }
            });
            
            Log.d(TAG, "WebView initialized with modern JS support");
        } else {
            Log.e(TAG, "WebView is null!");
        }
    }
}
