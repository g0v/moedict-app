# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Keep line numbers so release stack traces stay retraceable via the R8 mapping file.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# R8 (AGP 9, strict full mode) keep rules for the Capacitor WebView wrapper.
# Capacitor's own consumer rules already keep plugin entry points; the rules
# below cover the app module itself so shrinking/obfuscation can't break the
# JS bridge or reflective plugin loading.

# Annotations and signatures consulted by the Capacitor bridge at runtime.
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepattributes JavascriptInterface

# WebView JavaScript bridge methods must survive shrinking and obfuscation.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor plugins are instantiated via reflection.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }

# Cordova-compat plugins loaded by class name.
-keep public class * extends org.apache.cordova.CordovaPlugin {
    public <methods>;
    public <fields>;
}

# App entry point referenced from AndroidManifest.xml.
-keep public class tw.moedict.app.MainActivity { *; }
