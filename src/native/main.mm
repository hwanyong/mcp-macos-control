#include <ApplicationServices/ApplicationServices.h>
#include <chrono>
#include <iostream>
#include <napi.h>
#include <string>
#include <thread>
#include <vector>

// Helper to check coordinates
void ValidateCoordinates(const Napi::CallbackInfo &info) {
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::Error::New(info.Env(), "Expected x and y coordinates")
        .ThrowAsJavaScriptException();
  }
}

// Mouse: Move
Napi::Value MoveMouse(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  ValidateCoordinates(info);
  if (env.IsExceptionPending())
    return env.Null();

  double x = info[0].As<Napi::Number>().DoubleValue();
  double y = info[1].As<Napi::Number>().DoubleValue();

  CGPoint point = CGPointMake(x, y);
  CGWarpMouseCursorPosition(point);

  return env.Null();
}

// Mouse: Drag
Napi::Value DragMouse(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  ValidateCoordinates(info);
  if (env.IsExceptionPending())
    return env.Null();

  double x = info[0].As<Napi::Number>().DoubleValue();
  double y = info[1].As<Napi::Number>().DoubleValue();

  CGPoint point = CGPointMake(x, y);
  CGWarpMouseCursorPosition(point);
  CGEventSourceRef source =
      CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
  CGEventRef event = CGEventCreateMouseEvent(source, kCGEventLeftMouseDragged,
                                             point, kCGMouseButtonLeft);
  CGEventPost(kCGHIDEventTap, event);
  CFRelease(event);
  CFRelease(source);

  return env.Null();
}

// Mouse: Click
Napi::Value MouseClick(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  std::string button = "left";
  bool doubleClick = false;

  if (info.Length() > 0 && info[0].IsString()) {
    button = info[0].As<Napi::String>().Utf8Value();
  }
  if (info.Length() > 1 && info[1].IsBoolean()) {
    doubleClick = info[1].As<Napi::Boolean>().Value();
  }

  CGMouseButton cgButton = kCGMouseButtonLeft;
  CGEventType downType = kCGEventLeftMouseDown;
  CGEventType upType = kCGEventLeftMouseUp;

  if (button == "right") {
    cgButton = kCGMouseButtonRight;
    downType = kCGEventRightMouseDown;
    upType = kCGEventRightMouseUp;
  } else if (button == "middle") {
    cgButton = kCGMouseButtonCenter;
    downType = kCGEventOtherMouseDown;
    upType = kCGEventOtherMouseUp;
  }

  CGEventRef currentPosEvent = CGEventCreate(NULL);
  CGPoint point = CGEventGetLocation(currentPosEvent);
  CFRelease(currentPosEvent);

  CGEventSourceRef source =
      CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
  CGEventRef down = CGEventCreateMouseEvent(source, downType, point, cgButton);
  CGEventRef up = CGEventCreateMouseEvent(source, upType, point, cgButton);

  if (doubleClick) {
    CGEventSetIntegerValueField(down, kCGMouseEventClickState, 2);
    CGEventSetIntegerValueField(up, kCGMouseEventClickState, 2);
  }

  CGEventPost(kCGHIDEventTap, down);
  CGEventPost(kCGHIDEventTap, up);

  if (doubleClick) {
    // For double click, we might need to send another pair or just rely on
    // click count Usually sending two clicks with count 1 and 2 respectively is
    // safer
    CGEventSetIntegerValueField(down, kCGMouseEventClickState, 1);
    CGEventSetIntegerValueField(up, kCGMouseEventClickState, 1);
    CGEventPost(kCGHIDEventTap, down);
    CGEventPost(kCGHIDEventTap, up);

    CGEventSetIntegerValueField(down, kCGMouseEventClickState, 2);
    CGEventSetIntegerValueField(up, kCGMouseEventClickState, 2);
    CGEventPost(kCGHIDEventTap, down);
    CGEventPost(kCGHIDEventTap, up);
  }

  CFRelease(down);
  CFRelease(up);
  CFRelease(source);

  return env.Null();
}

// Mouse: Scroll
Napi::Value ScrollMouse(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::Error::New(env, "Expected x and y scroll amounts")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  int x = info[0].As<Napi::Number>().Int32Value();
  int y = info[1].As<Napi::Number>().Int32Value();

  // CGEventCreateScrollWheelEvent argument order: source, units, wheelCount,
  // wheel1, wheel2... wheel1 is Y (vertical), wheel2 is X (horizontal)
  CGEventSourceRef source =
      CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
  CGEventRef event =
      CGEventCreateScrollWheelEvent(source, kCGScrollEventUnitPixel, 2, y, x);
  CGEventPost(kCGHIDEventTap, event);
  CFRelease(event);
  CFRelease(source);

  return env.Null();
}

// Mouse: Get Position
Napi::Value GetMousePos(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  CGEventRef event = CGEventCreate(NULL);
  CGPoint point = CGEventGetLocation(event);
  CFRelease(event);

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", point.x);
  obj.Set("y", point.y);
  return obj;
}

// Mouse: Toggle (Drag start/end helper)
Napi::Value MouseToggle(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  std::string type = "down";
  std::string button = "left";

  if (info.Length() > 0 && info[0].IsString())
    type = info[0].As<Napi::String>().Utf8Value();
  if (info.Length() > 1 && info[1].IsString())
    button = info[1].As<Napi::String>().Utf8Value();

  CGMouseButton cgButton = kCGMouseButtonLeft;
  CGEventType eventType = kCGEventLeftMouseDown;

  if (button == "right")
    cgButton = kCGMouseButtonRight;
  else if (button == "middle")
    cgButton = kCGMouseButtonCenter;

  if (type == "down") {
    if (button == "left")
      eventType = kCGEventLeftMouseDown;
    else if (button == "right")
      eventType = kCGEventRightMouseDown;
    else
      eventType = kCGEventOtherMouseDown;
  } else {
    if (button == "left")
      eventType = kCGEventLeftMouseUp;
    else if (button == "right")
      eventType = kCGEventRightMouseUp;
    else
      eventType = kCGEventOtherMouseUp;
  }

  CGEventRef currentPosEvent = CGEventCreate(NULL);
  CGPoint point = CGEventGetLocation(currentPosEvent);
  CFRelease(currentPosEvent);

  CGEventSourceRef source =
      CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
  CGEventRef event =
      CGEventCreateMouseEvent(source, eventType, point, cgButton);
  CGEventPost(kCGHIDEventTap, event);
  CFRelease(event);
  CFRelease(source);

  return env.Null();
}

// Screen: Get Size
Napi::Value GetScreenSize(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  CGDirectDisplayID displayId = CGMainDisplayID();
  size_t width = CGDisplayPixelsWide(displayId);
  size_t height = CGDisplayPixelsHigh(displayId);

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("width", width);
  obj.Set("height", height);
  return obj;
}

// Keyboard: Key Tap
// Map basic keys. For full support, we need a mapping table.
// For now, we'll implement a basic mapping for common keys.
CGKeyCode GetKeyCode(const std::string &key) {
  if (key == "enter" || key == "return")
    return 36;
  if (key == "backspace")
    return 51;
  if (key == "tab")
    return 48;
  if (key == "space")
    return 49;
  if (key == "escape")
    return 53;
  if (key == "command")
    return 55;
  if (key == "shift")
    return 56;
  if (key == "alt" || key == "option")
    return 58;
  if (key == "control")
    return 59;
  if (key == "left")
    return 123;
  if (key == "right")
    return 124;
  if (key == "down")
    return 125;
  if (key == "up")
    return 126;

  // Alphanumeric (simplified)
  if (key.length() == 1) {
    char c = tolower(key[0]);
    if (c >= 'a' && c <= 'z') {
      // A is 0, S is 1, D is 2... this is QWERTY layout dependent
      // Using a partial map for common letters
      switch (c) {
      case 'a':
        return 0;
      case 's':
        return 1;
      case 'd':
        return 2;
      case 'f':
        return 3;
      case 'h':
        return 4;
      case 'g':
        return 5;
      case 'z':
        return 6;
      case 'x':
        return 7;
      case 'c':
        return 8;
      case 'v':
        return 9;
      case 'b':
        return 11;
      case 'q':
        return 12;
      case 'w':
        return 13;
      case 'e':
        return 14;
      case 'r':
        return 15;
      case 'y':
        return 16;
      case 't':
        return 17;
      case '1':
        return 18;
      case '2':
        return 19;
      case '3':
        return 20;
      case '4':
        return 21;
      case '6':
        return 22;
      case '5':
        return 23;
      case '9':
        return 25;
      case '7':
        return 26;
      case '8':
        return 28;
      case '0':
        return 29;
      case 'o':
        return 31;
      case 'u':
        return 32;
      case 'i':
        return 34;
      case 'p':
        return 35;
      case 'l':
        return 37;
      case 'j':
        return 38;
      case 'k':
        return 40;
      case 'n':
        return 45;
      case 'm':
        return 46;
      }
    }
  }
  return 0; // Unknown
}

Napi::Value KeyTap(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::Error::New(env, "Expected key string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string key = info[0].As<Napi::String>().Utf8Value();
  std::vector<std::string> modifiers;
  if (info.Length() > 1 && info[1].IsArray()) {
    Napi::Array mods = info[1].As<Napi::Array>();
    for (uint32_t i = 0; i < mods.Length(); i++) {
      Napi::Value val = mods[i];
      if (val.IsString())
        modifiers.push_back(val.As<Napi::String>().Utf8Value());
    }
  }

  CGKeyCode keyCode = GetKeyCode(key);

  // Create event source
  CGEventSourceRef source =
      CGEventSourceCreate(kCGEventSourceStateHIDSystemState);

  // Press modifiers
  for (const auto &mod : modifiers) {
    CGEventRef modDown =
        CGEventCreateKeyboardEvent(source, GetKeyCode(mod), true);
    CGEventPost(kCGHIDEventTap, modDown);
    CFRelease(modDown);
  }

  // Press key
  CGEventRef keyDown = CGEventCreateKeyboardEvent(source, keyCode, true);
  CGEventPost(kCGHIDEventTap, keyDown);
  CFRelease(keyDown);

  // Release key
  CGEventRef keyUp = CGEventCreateKeyboardEvent(source, keyCode, false);
  CGEventPost(kCGHIDEventTap, keyUp);
  CFRelease(keyUp);

  // Release modifiers (reverse order)
  for (auto it = modifiers.rbegin(); it != modifiers.rend(); ++it) {
    CGEventRef modUp =
        CGEventCreateKeyboardEvent(source, GetKeyCode(*it), false);
    CGEventPost(kCGHIDEventTap, modUp);
    CFRelease(modUp);
  }

  CFRelease(source);
  return env.Null();
}

// Keyboard: Type String
Napi::Value TypeString(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::Error::New(env, "Expected string to type")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string text = info[0].As<Napi::String>().Utf8Value();
  CGEventSourceRef source =
      CGEventSourceCreate(kCGEventSourceStateHIDSystemState);

  for (char c : text) {
    // Very basic ASCII mapping.
    // In a real app, we'd need a full keyboard layout map or use UniChar.
    // For now, we reuse GetKeyCode which handles basic chars.
    // Note: This ignores case (shift) for simplicity in this MVP.
    std::string key(1, c);
    CGKeyCode code = GetKeyCode(key);

    CGEventRef down = CGEventCreateKeyboardEvent(source, code, true);
    CGEventRef up = CGEventCreateKeyboardEvent(source, code, false);

    CGEventPost(kCGHIDEventTap, down);
    CGEventPost(kCGHIDEventTap, up);

    CFRelease(down);
    CFRelease(up);

    // Small delay
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }

  CFRelease(source);
  return env.Null();
}

// Permissions
Napi::Value CheckPermissions(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  bool trusted = AXIsProcessTrusted();
  return Napi::Boolean::New(env, trusted);
}

// Init
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "moveMouse"),
              Napi::Function::New(env, MoveMouse));
  exports.Set(Napi::String::New(env, "dragMouse"),
              Napi::Function::New(env, DragMouse));
  exports.Set(Napi::String::New(env, "mouseClick"),
              Napi::Function::New(env, MouseClick));
  exports.Set(Napi::String::New(env, "mouseToggle"),
              Napi::Function::New(env, MouseToggle));
  exports.Set(Napi::String::New(env, "scrollMouse"),
              Napi::Function::New(env, ScrollMouse));
  exports.Set(Napi::String::New(env, "getMousePos"),
              Napi::Function::New(env, GetMousePos));
  exports.Set(Napi::String::New(env, "getScreenSize"),
              Napi::Function::New(env, GetScreenSize));
  exports.Set(Napi::String::New(env, "keyTap"),
              Napi::Function::New(env, KeyTap));
  exports.Set(Napi::String::New(env, "typeString"),
              Napi::Function::New(env, TypeString));
  exports.Set(Napi::String::New(env, "checkPermissions"),
              Napi::Function::New(env, CheckPermissions));
  return exports;
}

NODE_API_MODULE(macos_control, Init)
