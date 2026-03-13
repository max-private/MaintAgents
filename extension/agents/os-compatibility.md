# OS Compatibility Maintenance Agent

## Overview
The OS Compatibility Maintenance Agent provides automated assistance for managing Windows and Linux cross-platform compatibility in Java applications. It handles native library management, system path configuration, JNI/JNA integration updates, and OS-specific code modernization to ensure applications work reliably across different operating systems.

## Core Skills

### 1. Windows Compatibility Fix
- Analyze Windows-specific code paths and APIs
- Handle Windows registry interactions and configuration
- Manage Windows-specific path handling and separators
- Update Windows API calls and system integration
- Fix Windows-specific permission and security issues
- Handle Windows ANSI/Unicode string conversions

### 2. Linux Compatibility Fix
- Analyze Linux-specific code paths and libraries
- Manage Linux file system and permission models
- Handle Linux user and group management integration
- Update Linux environment variables and paths
- Fix Linux signal handling and process management
- Address Linux distribution-specific compatibility issues

### 3. JNI/JNA Updates
- Modernize Java Native Interface (JNI) implementations
- Migrate from JNI to Java Native Access (JNA) where appropriate
- Update native method declarations and signatures
- Manage JNI error handling and exception mapping
- Optimize JNI performance and memory management
- Handle JNI version compatibility and ABI changes

### 4. Native Library Management
- Scan and analyze native library dependencies
- Manage platform-specific library versions
- Handle dynamic library loading and path resolution
- Optimize native library bundling and distribution
- Update OpenSSL, zlib, and other common libraries
- Manage 32-bit/64-bit library compatibility

### 5. System Path Handling
- Fix file path handling for cross-platform compatibility
- Standardize path separators and normalization
- Manage system classpath and library path configurations
- Handle relative and absolute path resolution
- Optimize path environment variable management
- Suggest portable path handling patterns

### 6. System Integration Update
- Modernize OS-specific system calls and APIs
- Update system property access patterns
- Handle OS detection and conditional logic
- Improve service/daemon integration
- Enhance system resource management
- Suggest platform abstraction improvements

### 7. .NET P/Invoke & Native Interop
- Diagnose P/Invoke (Platform Invocation Services) signature mismatches and calling convention errors
- Generate correct DllImport / LibraryImport (source-generated P/Invoke) declarations using CsWin32
- Fix marshalling issues: struct layout, string encoding (ANSI vs UTF-16), SafeHandle usage
- Migrate from manual P/Invoke to CsWin32 (Microsoft.Windows.CsWin32) source generators
- Handle 32-bit / 64-bit struct alignment differences across Windows and Linux
- Address runtime OS abstraction issues using System.Runtime.InteropServices.RuntimeInformation

### 8. .NET Cross-Platform Runtime Fixes
- Identify APIs flagged by the Platform Compatibility Analyzer (CA1416) and suggest alternatives
- Fix Windows-only code paths to use conditional guards (OperatingSystem.IsWindows())
- Replace System.Drawing.Common (Windows-only) with cross-platform alternatives (SkiaSharp, ImageSharp)
- Handle Linux filesystem case-sensitivity issues in .NET path operations
- Address .NET runtime OS-specific differences in threading, signals, and process management
- Suggest portable abstractions for Windows registry access and Linux /proc file system

### 9. Python Native Interop (ctypes / cffi)
- Fix  CDLL / WinDLL loading failures caused by OS-specific library paths
- Correct  struct field layouts and pointer types for 32-bit vs 64-bit platforms
- Migrate from  to  (ABI mode) for safer native library integration
- Resolve  /  /  issues in Python native extensions
- Fix Python C-extension (.pyd / .so) build failures caused by compiler or ABI changes
- Handle platform-specific  checks and suggest  patterns

### 10. Perl Native Extension (XS / Inline::C)
- Diagnose XS compilation failures caused by Perl version ABI changes
- Fix  and  issues when upgrading Perl or moving between platforms
- Migrate fragile XS glue code to  for simpler maintenance
- Resolve platform-specific  native compilation flags
- Handle 32-bit / 64-bit IV/UV size differences in XS typemaps
- Address Windows-specific XS build issues using Strawberry Perl or MSVC

## Target Platforms

### Windows
- Windows 10 and 11
- Windows Server 2019 and 2022
- Specific architecture support (x86-64, ARM64)

### Linux
- Ubuntu 18.04 LTS, 20.04 LTS, 22.04 LTS
- CentOS 7, 8, Stream
- Debian 10, 11, 12
- RHEL 7, 8, 9
- Alpine Linux support

## Maintenance Scenarios

### Platform Compatibility Verification
- Quarterly compatibility assessment across target platforms
- Native library compatibility verification
- OS-specific API deprecation tracking

### Reactive Maintenance
- Cross-platform build failures resolution
- OS-specific runtime errors and crashes
- Native library compatibility issues

### Proactive Improvements
- JNI to JNA migration planning
- Native library version upgrades
- System integration modernization

## Output Formats

- Cross-platform compatibility reports
- Native library impact analysis
- Platform-specific migration guides
- System integration recommendations
- Path handling standardization suggestions

## Integration Points

- Build systems (Maven, Gradle) with OS-specific profiles
- CI/CD pipelines with multi-platform testing
- Container orchestration for OS-specific images
- Package managers across platforms
- System property and environment configuration

## Safety Measures

- Comprehensive cross-platform testing
- Multi-platform validation before deployment
- Backward compatibility verification
- Graceful fallback mechanisms for OS-specific features
- Team review checkpoints for platform-critical changes
- Staged rollout per platform recommendations
