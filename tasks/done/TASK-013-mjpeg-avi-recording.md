---
id: TASK-013
title: Replace PNG frame capture with MJPEG AVI video output
status: completed
model: medium
model-name: GPT-5.2
context:
  - docs/context/unity-sdk.md
doc-impact:
  - docs/context/unity-sdk.md
---

## Description

Currently `SessionRecorder` saves each captured frame as a PNG file and writes a `recording_manifest.json` at session end. This produces thousands of files and uses several GB of storage per session — impractical for on-device use.

Replace this with a single `recording.avi` file per session using MJPEG encoding. Frames are captured as JPEG (not PNG) and written directly into the AVI container via a new `MjpegAviWriter` class. No PNG files are saved; no manifest is needed.

Add two new serialized fields to `SessionRecorder`:
- `captureResolutionScale` (float, default `0.5`) — multiplied against `Screen.width/height` for the `RenderTexture` resolution. Clamped to [0.1, 1.0].
- `captureJpegQuality` (int, default `75`) — passed to `Texture2D.EncodeToJPG(quality)`. Clamped to [1, 100].

These fields will be moved to `AnalyticsConfig` in TASK-014. For now they are inspector-exposed on `SessionRecorder`.

---

## Files to create / modify

| File | Action |
|------|--------|
| `packages/com.cre.analytics/Runtime/MjpegAviWriter.cs` | **Create** — pure C# AVI writer |
| `packages/com.cre.analytics/Runtime/SessionRecorder.cs` | **Modify** — use writer instead of PNG files |

---

## MjpegAviWriter — public interface

```csharp
namespace CRE.Analytics
{
    internal class MjpegAviWriter
    {
        // Opens the file and writes all header placeholders.
        public void Open(string filePath, int width, int height, int fps);

        // Writes one JPEG frame. Call once per captured frame.
        public void WriteFrame(byte[] jpegBytes);

        // Finalises the file: writes idx1, seeks back and fixes all size/count fields.
        public void Close();
    }
}
```

---

## AVI binary format

All values are **little-endian**. A chunk is: 4-byte FourCC + 4-byte uint32 size + data. A LIST is: `LIST` + uint32 size + 4-byte type + contents. Chunk sizes do not include the 8-byte chunk header.

### File layout

```
RIFF (size = fileSize - 8)  'AVI '
  LIST (size = 192)  'hdrl'
    'avih'  (size = 56)   AVIMAINHEADER
    LIST (size = 116)  'strl'
      'strh'  (size = 56)   AVISTREAMHEADER
      'strf'  (size = 40)   BITMAPINFOHEADER
  LIST (size = ?)  'movi'          ← size unknown at open; fix at Close
    '00dc'  (size = N)  <JPEG bytes>  ← one chunk per frame
    '00dc'  (size = N)  <JPEG bytes>
    ...
  'idx1'  (size = frameCount * 16)  AVIOLDINDEX[]
```

### FourCC byte literals

```csharp
static readonly byte[] RIFF = { 0x52,0x49,0x46,0x46 };
static readonly byte[] AVI_ = { 0x41,0x56,0x49,0x20 };
static readonly byte[] LIST = { 0x4C,0x49,0x53,0x54 };
static readonly byte[] hdrl = { 0x68,0x64,0x72,0x6C };
static readonly byte[] avih = { 0x61,0x76,0x69,0x68 };
static readonly byte[] strl = { 0x73,0x74,0x72,0x6C };
static readonly byte[] strh = { 0x73,0x74,0x72,0x68 };
static readonly byte[] strf = { 0x73,0x74,0x72,0x66 };
static readonly byte[] movi = { 0x6D,0x6F,0x76,0x69 };
static readonly byte[] dc00 = { 0x30,0x30,0x64,0x63 };  // '00dc'
static readonly byte[] idx1 = { 0x69,0x64,0x78,0x31 };
static readonly byte[] vids = { 0x76,0x69,0x64,0x73 };
static readonly byte[] MJPG = { 0x4D,0x4A,0x50,0x47 };
```

### AVIMAINHEADER — 56 bytes (written inside 'avih')

| Field | Type | Value |
|---|---|---|
| dwMicroSecPerFrame | uint32 | `1_000_000 / fps` |
| dwMaxBytesPerSec | uint32 | `width * height * 3 * fps` |
| dwPaddingGranularity | uint32 | 0 |
| dwFlags | uint32 | `0x10` (AVIF_HASINDEX) |
| dwTotalFrames | uint32 | **0 placeholder — fix at Close** |
| dwInitialFrames | uint32 | 0 |
| dwStreams | uint32 | 1 |
| dwSuggestedBufferSize | uint32 | `width * height * 3` |
| dwWidth | uint32 | width |
| dwHeight | uint32 | height |
| dwReserved[4] | uint32×4 | 0, 0, 0, 0 |

Record the file offset of `dwTotalFrames` (at `avih data start + 16`) so it can be fixed at `Close()`.

### AVISTREAMHEADER — 56 bytes (written inside 'strh')

| Field | Type | Value |
|---|---|---|
| fccType | uint32 | `vids` |
| fccHandler | uint32 | `MJPG` |
| dwFlags | uint32 | 0 |
| wPriority | uint16 | 0 |
| wLanguage | uint16 | 0 |
| dwInitialFrames | uint32 | 0 |
| dwScale | uint32 | 1 |
| dwRate | uint32 | fps |
| dwStart | uint32 | 0 |
| dwLength | uint32 | **0 placeholder — fix at Close** |
| dwSuggestedBufferSize | uint32 | `width * height * 3` |
| dwQuality | uint32 | `0xFFFFFFFF` |
| dwSampleSize | uint32 | 0 |
| rcFrame | int16×4 | 0, 0, (int16)width, (int16)height |

Record the file offset of `dwLength` (at `strh data start + 32`) so it can be fixed at `Close()`.

### BITMAPINFOHEADER — 40 bytes (written inside 'strf')

| Field | Type | Value |
|---|---|---|
| biSize | uint32 | 40 |
| biWidth | int32 | width |
| biHeight | int32 | height |
| biPlanes | uint16 | 1 |
| biBitCount | uint16 | 24 |
| biCompression | uint32 | `MJPG` |
| biSizeImage | uint32 | `width * height * 3` |
| biXPelsPerMeter | int32 | 0 |
| biYPelsPerMeter | int32 | 0 |
| biClrUsed | uint32 | 0 |
| biClrImportant | uint32 | 0 |

### Writing the movi LIST

After hdrl, write: `LIST` + uint32(0 placeholder) + `movi`. Record the position of that size field. Then for each frame:
1. Record current position as `frameOffset` (position of the '00dc' fourcc)
2. Write: `00dc` + uint32(jpegBytes.Length) + jpegBytes
3. If `jpegBytes.Length` is odd, write one padding byte `0x00`
4. Store `(frameOffset - moviDataStart, jpegBytes.Length)` for the idx1 index

`moviDataStart` = position of the 'movi' type field (i.e., the 4 bytes right after the movi LIST size field). The `dwOffset` in each idx1 entry = `frameOffset - moviDataStart`.

### Writing idx1 at Close

Each entry is 16 bytes:

| Field | Type | Value |
|---|---|---|
| ckid | uint32 | `00dc` |
| dwFlags | uint32 | `0x10` (AVIIF_KEYFRAME) |
| dwOffset | uint32 | frame offset relative to moviDataStart |
| dwSize | uint32 | JPEG byte count |

### Fixes at Close

After writing idx1:
1. Seek to RIFF size field (offset 4): write `(uint32)(fileStream.Length - 8)`
2. Seek to movi LIST size field: write `(uint32)(idx1StartPosition - moviListSizePosition - 4)`
3. Seek to `dwTotalFrames` position: write `(uint32)frameCount`
4. Seek to `dwLength` position: write `(uint32)frameCount`

---

## Changes to SessionRecorder.cs

### Fields to add
```csharp
[SerializeField] private float captureResolutionScale = 0.5f;
[SerializeField] private int captureJpegQuality = 75;
private MjpegAviWriter _aviWriter;
```

### Fields to remove
```csharp
private int _frameIndex;         // replace with _frameCount
private string _recordingPath;   // replace with _sessionFolder and _aviFilePath
```

### StartRecording changes
```csharp
_sessionFolder = Path.Combine(Application.persistentDataPath, "CRERecordings", sessionId);
Directory.CreateDirectory(_sessionFolder);
_aviFilePath = Path.Combine(_sessionFolder, "recording.avi");

int w = Mathf.Clamp(Mathf.RoundToInt(Screen.width  * captureResolutionScale), 1, Screen.width);
int h = Mathf.Clamp(Mathf.RoundToInt(Screen.height * captureResolutionScale), 1, Screen.height);
_renderTexture = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);

_aviWriter = new MjpegAviWriter();
_aviWriter.Open(_aviFilePath, w, h, captureFrameRate);
```

### CaptureFrame changes
Replace `EncodeToPNG` + `File.WriteAllBytes` with:
```csharp
byte[] bytes = tex.EncodeToJPG(captureJpegQuality);
Destroy(tex);
_aviWriter.WriteFrame(bytes);
_frameCount++;
```

### StopRecording changes
Replace `WriteManifest()` call with `_aviWriter.Close()`. Remove the `WriteManifest` method entirely. Update the log line:
```
[CRE Recorder] Recording saved — {_aviFilePath} ({_frameCount} frames)
```

### Remove entirely
- `WriteManifest()` method
- `_frameIndex` field (renamed to `_frameCount`)
- `sessionIdDisplay` field and all references to it (the canvas/text wiring from the prefab was for a scene-placed prefab; this component is now auto-bootstrapped without inspector wiring)

---

## Acceptance Criteria

- [ ] `MjpegAviWriter.cs` exists at `packages/com.cre.analytics/Runtime/MjpegAviWriter.cs`
- [ ] A 5-minute recording at 15fps produces a single `recording.avi` in `CRERecordings/{sessionId}/` that opens in a standard video player (VLC, Windows Media Player)
- [ ] No individual frame files (PNG or JPEG) are written to disk
- [ ] `captureResolutionScale` defaults to `0.5` and is clamped to [0.1, 1.0]
- [ ] `captureJpegQuality` defaults to `75` and is clamped to [1, 100]
- [ ] `WriteManifest()` is removed
- [ ] `sessionIdDisplay` field and all Text UI wiring are removed from `SessionRecorder`
- [ ] `MjpegAviWriter` uses `System.IO.FileStream` and `System.IO.BinaryWriter` only — no third-party libraries
- [ ] `MjpegAviWriter` is `internal` — not part of the public SDK surface

## Manual Step Required

After Windsurf completes this task, open Unity and let it compile.
