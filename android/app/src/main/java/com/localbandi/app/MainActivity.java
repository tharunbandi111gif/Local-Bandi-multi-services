package com.localbandi.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String pkg = getPackageName();
        String targetHtml = "index.html";

        if (pkg.contains("masteradmin") || pkg.endsWith(".admin")) {
            targetHtml = "admin.html";
        } else if (pkg.contains("branchadmin") || pkg.endsWith(".branch")) {
            targetHtml = "branch-admin.html";
        } else if (pkg.contains("delivery")) {
            targetHtml = "delivery.html";
        } else if (pkg.contains("vendor")) {
            targetHtml = "vendor.html";
        } else {
            targetHtml = "index.html";
        }

        if (getBridge() != null && getBridge().getWebView() != null && !targetHtml.equals("index.html")) {
            String serverUrl = getBridge().getServerUrl();
            if (serverUrl != null && !serverUrl.isEmpty()) {
                getBridge().getWebView().loadUrl(serverUrl.replaceAll("/+$", "") + "/" + targetHtml);
            } else {
                getBridge().getWebView().loadUrl("https://localhost/" + targetHtml);
            }
        }
    }
}
