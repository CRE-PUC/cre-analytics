using System;
using System.Collections.Generic;
using System.IO;

namespace CRE.Analytics
{
    internal class MjpegAviWriter
    {
        private static readonly byte[] RIFF = { 0x52, 0x49, 0x46, 0x46 };
        private static readonly byte[] AVI_ = { 0x41, 0x56, 0x49, 0x20 };
        private static readonly byte[] LIST = { 0x4C, 0x49, 0x53, 0x54 };
        private static readonly byte[] hdrl = { 0x68, 0x64, 0x72, 0x6C };
        private static readonly byte[] avih = { 0x61, 0x76, 0x69, 0x68 };
        private static readonly byte[] strl = { 0x73, 0x74, 0x72, 0x6C };
        private static readonly byte[] strh = { 0x73, 0x74, 0x72, 0x68 };
        private static readonly byte[] strf = { 0x73, 0x74, 0x72, 0x66 };
        private static readonly byte[] movi = { 0x6D, 0x6F, 0x76, 0x69 };
        private static readonly byte[] dc00 = { 0x30, 0x30, 0x64, 0x63 };
        private static readonly byte[] idx1 = { 0x69, 0x64, 0x78, 0x31 };
        private static readonly byte[] vids = { 0x76, 0x69, 0x64, 0x73 };
        private static readonly byte[] MJPG = { 0x4D, 0x4A, 0x50, 0x47 };

        private FileStream _fileStream;
        private BinaryWriter _writer;
        private int _width;
        private int _height;
        private int _fps;
        private int _frameCount;
        private long _riffSizePosition;
        private long _moviListSizePosition;
        private long _moviDataStart;
        private long _dwTotalFramesPosition;
        private long _dwLengthPosition;
        private List<(long offset, int size)> _frameIndex;

        public void Open(string filePath, int width, int height, int fps)
        {
            _width = width;
            _height = height;
            _fps = fps;
            _frameCount = 0;
            _frameIndex = new List<(long, int)>();

            _fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
            _writer = new BinaryWriter(_fileStream);

            WriteHeaders();
        }

        public void WriteFrame(byte[] jpegBytes)
        {
            long frameOffset = _fileStream.Position;
            _writer.Write(dc00);
            _writer.Write((uint)jpegBytes.Length);
            _writer.Write(jpegBytes);

            if (jpegBytes.Length % 2 == 1)
            {
                _writer.Write((byte)0x00);
            }

            _frameIndex.Add((frameOffset - _moviDataStart, jpegBytes.Length));
            _frameCount++;
        }

        public void Close()
        {
            long idx1StartPosition = _fileStream.Position;
            WriteIdx1();

            _fileStream.Seek(_riffSizePosition, SeekOrigin.Begin);
            _writer.Write((uint)(_fileStream.Length - 8));

            _fileStream.Seek(_moviListSizePosition, SeekOrigin.Begin);
            _writer.Write((uint)(idx1StartPosition - _moviListSizePosition - 4));

            _fileStream.Seek(_dwTotalFramesPosition, SeekOrigin.Begin);
            _writer.Write((uint)_frameCount);

            _fileStream.Seek(_dwLengthPosition, SeekOrigin.Begin);
            _writer.Write((uint)_frameCount);

            _writer.Close();
            _fileStream.Close();
        }

        private void WriteHeaders()
        {
            _writer.Write(RIFF);
            _riffSizePosition = _fileStream.Position;
            _writer.Write((uint)0);
            _writer.Write(AVI_);

            WriteHdrlList();
            WriteMoviListHeader();
        }

        private void WriteHdrlList()
        {
            _writer.Write(LIST);
            _writer.Write((uint)192);
            _writer.Write(hdrl);

            WriteAviMainHeader();
            WriteStrlList();
        }

        private void WriteAviMainHeader()
        {
            _writer.Write(avih);
            _writer.Write((uint)56);

            long avihDataStart = _fileStream.Position;

            _writer.Write((uint)(1_000_000 / _fps));
            _writer.Write((uint)(_width * _height * 3 * _fps));
            _writer.Write((uint)0);
            _writer.Write((uint)0x10);

            _dwTotalFramesPosition = _fileStream.Position;
            _writer.Write((uint)0);

            _writer.Write((uint)0);
            _writer.Write((uint)1);
            _writer.Write((uint)(_width * _height * 3));
            _writer.Write((uint)_width);
            _writer.Write((uint)_height);
            _writer.Write((uint)0);
            _writer.Write((uint)0);
            _writer.Write((uint)0);
            _writer.Write((uint)0);
        }

        private void WriteStrlList()
        {
            _writer.Write(LIST);
            _writer.Write((uint)116);
            _writer.Write(strl);

            WriteAviStreamHeader();
            WriteBitmapInfoHeader();
        }

        private void WriteAviStreamHeader()
        {
            _writer.Write(strh);
            _writer.Write((uint)56);

            long strhDataStart = _fileStream.Position;

            _writer.Write(vids);
            _writer.Write(MJPG);
            _writer.Write((uint)0);
            _writer.Write((ushort)0);
            _writer.Write((ushort)0);
            _writer.Write((uint)0);
            _writer.Write((uint)1);
            _writer.Write((uint)_fps);
            _writer.Write((uint)0);

            _dwLengthPosition = _fileStream.Position;
            _writer.Write((uint)0);

            _writer.Write((uint)(_width * _height * 3));
            _writer.Write((uint)0xFFFFFFFF);
            _writer.Write((uint)0);
            _writer.Write((short)0);
            _writer.Write((short)0);
            _writer.Write((short)_width);
            _writer.Write((short)_height);
        }

        private void WriteBitmapInfoHeader()
        {
            _writer.Write(strf);
            _writer.Write((uint)40);

            _writer.Write((uint)40);
            _writer.Write((int)_width);
            _writer.Write((int)_height);
            _writer.Write((ushort)1);
            _writer.Write((ushort)24);
            _writer.Write(MJPG);
            _writer.Write((uint)(_width * _height * 3));
            _writer.Write((int)0);
            _writer.Write((int)0);
            _writer.Write((uint)0);
            _writer.Write((uint)0);
        }

        private void WriteMoviListHeader()
        {
            _writer.Write(LIST);
            _moviListSizePosition = _fileStream.Position;
            _writer.Write((uint)0);
            _writer.Write(movi);
            _moviDataStart = _fileStream.Position;
        }

        private void WriteIdx1()
        {
            _writer.Write(idx1);
            _writer.Write((uint)(_frameCount * 16));

            foreach (var (offset, size) in _frameIndex)
            {
                _writer.Write(dc00);
                _writer.Write((uint)0x10);
                _writer.Write((uint)offset);
                _writer.Write((uint)size);
            }
        }
    }
}
