starting build "b15d5b01-8e65-44ad-883a-00f48a6b834b"
FETCHSOURCE
From https://github.com/arsathmalik0-netizen/G4K
 * branch            092018dbb9ad08b1dd04f2f36c6a394d18853d25 -> FETCH_HEAD
HEAD is now at 092018d fix: rewrite Dockerfile with proper WORKDIR, tighten .dockerignore, fix fly.toml paths — fixes build timeout
GitCommit:
092018dbb9ad08b1dd04f2f36c6a394d18853d25
BUILD
Starting Step #0 - "Pull"
Already have image (with digest): gcr.io/cloud-builders/docker
Error response from daemon: manifest for asia-south1-docker.pkg.dev/gen-lang-client-0786468307/cloud-run-source-deploy/arsathmalik0-netizen-g4k/g4k-git:latest not found: manifest unknown: Failed to fetch "latest"
Finished Step #0 - "Pull"
Starting Step #1 - "Build"
Already have image (with digest): gcr.io/cloud-builders/docker
Sending build context to Docker daemon  1.189MB
Step 1/12 : FROM dunglas/frankenphp:php8.4-alpine
php8.4-alpine: Pulling from dunglas/frankenphp
55afa1ecc21d: Already exists
6aafc61cfa24: Pulling fs layer
b0adb6bf83dd: Pulling fs layer
4932f93cf9f2: Pulling fs layer
23000e62071f: Pulling fs layer
3f3cc2788012: Pulling fs layer
9a98e4e8dfe7: Pulling fs layer
b51df144faae: Pulling fs layer
16b709da63fb: Pulling fs layer
ec3642f48ef9: Pulling fs layer
c987dc64560c: Pulling fs layer
f536bf4ca218: Pulling fs layer
2c3b01f90fe8: Pulling fs layer
f7e58518052d: Pulling fs layer
1ad36136d804: Pulling fs layer
72ddf142744e: Pulling fs layer
2667d030b375: Pulling fs layer
d2eb499a8bfc: Pulling fs layer
b0bd7ce38503: Pulling fs layer
4f4fb700ef54: Pulling fs layer
b51df144faae: Waiting
16b709da63fb: Waiting
ec3642f48ef9: Waiting
c987dc64560c: Waiting
f536bf4ca218: Waiting
2c3b01f90fe8: Waiting
f7e58518052d: Waiting
1ad36136d804: Waiting
72ddf142744e: Waiting
b0bd7ce38503: Waiting
4f4fb700ef54: Waiting
2667d030b375: Waiting
d2eb499a8bfc: Waiting
4932f93cf9f2: Download complete
3f3cc2788012: Verifying Checksum
3f3cc2788012: Download complete
b0adb6bf83dd: Verifying Checksum
b0adb6bf83dd: Download complete
b51df144faae: Verifying Checksum
b51df144faae: Download complete
6aafc61cfa24: Verifying Checksum
6aafc61cfa24: Download complete
ec3642f48ef9: Verifying Checksum
ec3642f48ef9: Download complete
16b709da63fb: Verifying Checksum
16b709da63fb: Download complete
c987dc64560c: Verifying Checksum
c987dc64560c: Download complete
2c3b01f90fe8: Verifying Checksum
2c3b01f90fe8: Download complete
f536bf4ca218: Verifying Checksum
f536bf4ca218: Download complete
23000e62071f: Verifying Checksum
23000e62071f: Download complete
f7e58518052d: Verifying Checksum
f7e58518052d: Download complete
1ad36136d804: Verifying Checksum
1ad36136d804: Download complete
72ddf142744e: Verifying Checksum
72ddf142744e: Download complete
9a98e4e8dfe7: Verifying Checksum
9a98e4e8dfe7: Download complete
4f4fb700ef54: Verifying Checksum
4f4fb700ef54: Download complete
2667d030b375: Download complete
6aafc61cfa24: Pull complete
d2eb499a8bfc: Verifying Checksum
d2eb499a8bfc: Download complete
b0adb6bf83dd: Pull complete
b0bd7ce38503: Verifying Checksum
b0bd7ce38503: Download complete
4932f93cf9f2: Pull complete
23000e62071f: Pull complete
3f3cc2788012: Pull complete
9a98e4e8dfe7: Pull complete
b51df144faae: Pull complete
16b709da63fb: Pull complete
ec3642f48ef9: Pull complete
c987dc64560c: Pull complete
f536bf4ca218: Pull complete
2c3b01f90fe8: Pull complete
f7e58518052d: Pull complete
1ad36136d804: Pull complete
72ddf142744e: Pull complete
2667d030b375: Pull complete
d2eb499a8bfc: Pull complete
b0bd7ce38503: Pull complete
4f4fb700ef54: Pull complete
Digest: sha256:3354314945be903be25ae88aa1d7de7eaebc7f244c9017d4005f60746bd35084
Status: Downloaded newer image for dunglas/frankenphp:php8.4-alpine
 ---> 69bb07d1e4eb
Step 2/12 : RUN apk add --no-cache     postgresql-dev     libpng-dev     libjpeg-turbo-dev     freetype-dev     libzip-dev     libgd     linux-headers     && docker-php-ext-configure gd --with-freetype --with-jpeg     && docker-php-ext-install -j$(nproc) gd pdo pdo_pgsql pgsql zip pcntl posix opcache bcmath     && apk del         postgresql-dev         libpng-dev         libjpeg-turbo-dev         freetype-dev         libzip-dev         linux-headers
 ---> Running in 6c57f9357ab6
( 1/68) Installing libbz2 (1.0.8-r6)
( 2/68) Installing libpng (1.6.58-r1)
( 3/68) Installing freetype (2.14.3-r0)
( 4/68) Installing pkgconf (2.5.1-r0)
( 5/68) Installing bzip2-dev (1.0.8-r6)
( 6/68) Installing brotli (1.2.0-r1)
( 7/68) Installing brotli-dev (1.2.0-r1)
( 8/68) Installing zlib-dev (1.3.2-r0)
( 9/68) Installing libpng-dev (1.6.58-r1)
(10/68) Installing freetype-dev (2.14.3-r0)
(11/68) Installing libxau (1.0.12-r0)
(12/68) Installing libmd (1.2.0-r0)
(13/68) Installing libbsd (0.12.2-r0)
(14/68) Installing libxdmcp (1.1.5-r1)
(15/68) Installing libxcb (1.17.0-r2)
(16/68) Installing libx11 (1.8.13-r0)
(17/68) Installing libxext (1.3.7-r0)
(18/68) Installing libice (1.1.2-r0)
(19/68) Installing libuuid (2.42.1-r0)
(20/68) Installing libsm (1.2.6-r0)
(21/68) Installing libxt (1.3.1-r0)
(22/68) Installing libxpm (3.5.19-r0)
(23/68) Installing aom-libs (3.14.1-r0)
(24/68) Installing libdav1d (1.5.3-r0)
(25/68) Installing libjpeg-turbo (3.1.3-r0)
(26/68) Installing libyuv (0.0.1928-r0)
(27/68) Installing libavif (1.4.1-r0)
(28/68) Installing libexpat (2.8.2-r0)
(29/68) Installing fontconfig (2.17.1-r1)
(30/68) Installing libsharpyuv (1.6.0-r0)
(31/68) Installing libwebp (1.6.0-r0)
(32/68) Installing tiff (4.7.1-r0)
(33/68) Installing libgd (2.3.3-r10)
(34/68) Installing libturbojpeg (3.1.3-r0)
(35/68) Installing libjpeg-turbo-dev (3.1.3-r0)
(36/68) Installing libzip (1.11.4-r2)
(37/68) Installing libzip-tools (1.11.4-r2)
(38/68) Installing xz-dev (5.8.3-r0)
(39/68) Installing zstd (1.5.7-r2)
(40/68) Installing zstd-dev (1.5.7-r2)
(41/68) Installing libzip-dev (1.11.4-r2)
(42/68) Installing linux-headers (7.0.0-r1)
(43/68) Installing libpq (18.4-r0)
(44/68) Installing openssl-dev (3.5.7-r0)
(45/68) Installing libpq-dev (18.4-r0)
(46/68) Installing libecpg (18.4-r0)
(47/68) Installing libecpg-dev (18.4-r0)
(48/68) Installing liburing-ffi (2.14-r0)
(49/68) Installing liburing (2.14-r0)
(50/68) Installing liburing-dev (2.14-r0)
(51/68) Installing clang22-headers (22.1.3-r2)
(52/68) Installing libffi (3.5.2-r1)
(53/68) Installing llvm22-libs (22.1.3-r0)
(54/68) Installing clang22-libs (22.1.3-r2)
(55/68) Installing fortify-headers (3.0.1-r2)
(56/68) Installing libgcc-static (15.2.0-r5)
(57/68) Installing libstdc++-dev (15.2.0-r5)
(58/68) Installing llvm22-linker-tools (22.1.3-r0)
(59/68) Installing musl-dev (1.2.6-r2)
(60/68) Installing clang22 (22.1.3-r2)
(61/68) Installing icu-data-en (78.1-r0)
  Executing icu-data-en-78.1-r0.post-install
  * If you need ICU with non-English locales and legacy charset support, install
  * package icu-data-full.
(62/68) Installing icu-libs (78.1-r0)
(63/68) Installing icu (78.1-r0)
(64/68) Installing icu-dev (78.1-r0)
(65/68) Installing llvm22 (22.1.3-r0)
(66/68) Installing lz4-libs (1.10.0-r1)
(67/68) Installing lz4-dev (1.10.0-r1)
(68/68) Installing postgresql18-dev (18.4-r0)
Executing busybox-1.37.0-r31.trigger
OK: 519.9 MiB in 116 packages
( 1/20) Installing m4 (1.4.20-r1)
( 2/20) Installing perl (5.42.2-r0)
( 3/20) Installing autoconf (2.73-r0)
( 4/20) Installing dpkg-dev (1.23.7-r0)
( 5/20) Installing dpkg (1.23.7-r0)
( 6/20) Installing libmagic (5.47-r2)
( 7/20) Installing file (5.47-r2)
( 8/20) Installing jansson (2.15.0-r0)
( 9/20) Installing binutils (2.45.1-r1)
(10/20) Installing libgomp (15.2.0-r5)
(11/20) Installing libatomic (15.2.0-r5)
(12/20) Installing gmp (6.3.0-r4)
(13/20) Installing isl26 (0.26-r2)
(14/20) Installing mpfr4 (4.2.2-r0)
(15/20) Installing mpc1 (1.3.1-r1)
(16/20) Installing gcc (15.2.0-r5)
(17/20) Installing g++ (15.2.0-r5)
(18/20) Installing make (4.4.1-r4)
(19/20) Installing re2c (4.5.1-r0)
(20/20) Installing .phpize-deps-configure (20260812.092839)
Executing busybox-1.37.0-r31.trigger
OK: 800.4 MiB in 136 packages
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking for GD support... yes, shared
checking for external libgd... no
checking for libavif... no
checking for libwebp... no
checking for libjpeg... yes
checking for libXpm... no
checking for FreeType 2... yes
checking whether to enable JIS-mapped Japanese font support in GD... no
checking for zlib >= 1.2.11... yes
checking for libpng... yes
checking for libjpeg... yes
checking for freetype2... yes
checking whether build works... yes
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/gd.c -o gd.lo  -MMD -MF gd.dep -MT gd.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_avif.c -o libgd/gd_avif.lo  -MMD -MF libgd/gd_avif.dep -MT libgd/gd_avif.lo
mkdir .libs
mkdir libgd/.libs
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/gd.c -MMD -MF gd.dep -MT gd.lo  -fPIC -DPIC -o .libs/gd.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_avif.c -MMD -MF libgd/gd_avif.dep -MT libgd/gd_avif.lo  -fPIC -DPIC -o libgd/.libs/gd_avif.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_bmp.c -o libgd/gd_bmp.lo  -MMD -MF libgd/gd_bmp.dep -MT libgd/gd_bmp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_bmp.c -MMD -MF libgd/gd_bmp.dep -MT libgd/gd_bmp.lo  -fPIC -DPIC -o libgd/.libs/gd_bmp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_color_match.c -o libgd/gd_color_match.lo  -MMD -MF libgd/gd_color_match.dep -MT libgd/gd_color_match.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_color_match.c -MMD -MF libgd/gd_color_match.dep -MT libgd/gd_color_match.lo  -fPIC -DPIC -o libgd/.libs/gd_color_match.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_crop.c -o libgd/gd_crop.lo  -MMD -MF libgd/gd_crop.dep -MT libgd/gd_crop.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_crop.c -MMD -MF libgd/gd_crop.dep -MT libgd/gd_crop.lo  -fPIC -DPIC -o libgd/.libs/gd_crop.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_filter.c -o libgd/gd_filter.lo  -MMD -MF libgd/gd_filter.dep -MT libgd/gd_filter.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_filter.c -MMD -MF libgd/gd_filter.dep -MT libgd/gd_filter.lo  -fPIC -DPIC -o libgd/.libs/gd_filter.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gd.c -o libgd/gd_gd.lo  -MMD -MF libgd/gd_gd.dep -MT libgd/gd_gd.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gd.c -MMD -MF libgd/gd_gd.dep -MT libgd/gd_gd.lo  -fPIC -DPIC -o libgd/.libs/gd_gd.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gd2.c -o libgd/gd_gd2.lo  -MMD -MF libgd/gd_gd2.dep -MT libgd/gd_gd2.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gd2.c -MMD -MF libgd/gd_gd2.dep -MT libgd/gd_gd2.lo  -fPIC -DPIC -o libgd/.libs/gd_gd2.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_in.c -o libgd/gd_gif_in.lo  -MMD -MF libgd/gd_gif_in.dep -MT libgd/gd_gif_in.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_in.c -MMD -MF libgd/gd_gif_in.dep -MT libgd/gd_gif_in.lo  -fPIC -DPIC -o libgd/.libs/gd_gif_in.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_out.c -o libgd/gd_gif_out.lo  -MMD -MF libgd/gd_gif_out.dep -MT libgd/gd_gif_out.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_out.c -MMD -MF libgd/gd_gif_out.dep -MT libgd/gd_gif_out.lo  -fPIC -DPIC -o libgd/.libs/gd_gif_out.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_interpolation.c -o libgd/gd_interpolation.lo  -MMD -MF libgd/gd_interpolation.dep -MT libgd/gd_interpolation.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_dp.c -o libgd/gd_io_dp.lo  -MMD -MF libgd/gd_io_dp.dep -MT libgd/gd_io_dp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_interpolation.c -MMD -MF libgd/gd_interpolation.dep -MT libgd/gd_interpolation.lo  -fPIC -DPIC -o libgd/.libs/gd_interpolation.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_dp.c -MMD -MF libgd/gd_io_dp.dep -MT libgd/gd_io_dp.lo  -fPIC -DPIC -o libgd/.libs/gd_io_dp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_file.c -o libgd/gd_io_file.lo  -MMD -MF libgd/gd_io_file.dep -MT libgd/gd_io_file.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_file.c -MMD -MF libgd/gd_io_file.dep -MT libgd/gd_io_file.lo  -fPIC -DPIC -o libgd/.libs/gd_io_file.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_ss.c -o libgd/gd_io_ss.lo  -MMD -MF libgd/gd_io_ss.dep -MT libgd/gd_io_ss.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_ss.c -MMD -MF libgd/gd_io_ss.dep -MT libgd/gd_io_ss.lo  -fPIC -DPIC -o libgd/.libs/gd_io_ss.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io.c -o libgd/gd_io.lo  -MMD -MF libgd/gd_io.dep -MT libgd/gd_io.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io.c -MMD -MF libgd/gd_io.dep -MT libgd/gd_io.lo  -fPIC -DPIC -o libgd/.libs/gd_io.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_jpeg.c -o libgd/gd_jpeg.lo  -MMD -MF libgd/gd_jpeg.dep -MT libgd/gd_jpeg.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_jpeg.c -MMD -MF libgd/gd_jpeg.dep -MT libgd/gd_jpeg.lo  -fPIC -DPIC -o libgd/.libs/gd_jpeg.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_matrix.c -o libgd/gd_matrix.lo  -MMD -MF libgd/gd_matrix.dep -MT libgd/gd_matrix.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_matrix.c -MMD -MF libgd/gd_matrix.dep -MT libgd/gd_matrix.lo  -fPIC -DPIC -o libgd/.libs/gd_matrix.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_pixelate.c -o libgd/gd_pixelate.lo  -MMD -MF libgd/gd_pixelate.dep -MT libgd/gd_pixelate.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_pixelate.c -MMD -MF libgd/gd_pixelate.dep -MT libgd/gd_pixelate.lo  -fPIC -DPIC -o libgd/.libs/gd_pixelate.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_png.c -o libgd/gd_png.lo  -MMD -MF libgd/gd_png.dep -MT libgd/gd_png.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_png.c -MMD -MF libgd/gd_png.dep -MT libgd/gd_png.lo  -fPIC -DPIC -o libgd/.libs/gd_png.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_rotate.c -o libgd/gd_rotate.lo  -MMD -MF libgd/gd_rotate.dep -MT libgd/gd_rotate.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_rotate.c -MMD -MF libgd/gd_rotate.dep -MT libgd/gd_rotate.lo  -fPIC -DPIC -o libgd/.libs/gd_rotate.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_security.c -o libgd/gd_security.lo  -MMD -MF libgd/gd_security.dep -MT libgd/gd_security.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_security.c -MMD -MF libgd/gd_security.dep -MT libgd/gd_security.lo  -fPIC -DPIC -o libgd/.libs/gd_security.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_ss.c -o libgd/gd_ss.lo  -MMD -MF libgd/gd_ss.dep -MT libgd/gd_ss.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_tga.c -o libgd/gd_tga.lo  -MMD -MF libgd/gd_tga.dep -MT libgd/gd_tga.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_ss.c -MMD -MF libgd/gd_ss.dep -MT libgd/gd_ss.lo  -fPIC -DPIC -o libgd/.libs/gd_ss.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_tga.c -MMD -MF libgd/gd_tga.dep -MT libgd/gd_tga.lo  -fPIC -DPIC -o libgd/.libs/gd_tga.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_topal.c -o libgd/gd_topal.lo  -MMD -MF libgd/gd_topal.dep -MT libgd/gd_topal.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_topal.c -MMD -MF libgd/gd_topal.dep -MT libgd/gd_topal.lo  -fPIC -DPIC -o libgd/.libs/gd_topal.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_transform.c -o libgd/gd_transform.lo  -MMD -MF libgd/gd_transform.dep -MT libgd/gd_transform.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_transform.c -MMD -MF libgd/gd_transform.dep -MT libgd/gd_transform.lo  -fPIC -DPIC -o libgd/.libs/gd_transform.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_wbmp.c -o libgd/gd_wbmp.lo  -MMD -MF libgd/gd_wbmp.dep -MT libgd/gd_wbmp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_wbmp.c -MMD -MF libgd/gd_wbmp.dep -MT libgd/gd_wbmp.lo  -fPIC -DPIC -o libgd/.libs/gd_wbmp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_webp.c -o libgd/gd_webp.lo  -MMD -MF libgd/gd_webp.dep -MT libgd/gd_webp.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_xbm.c -o libgd/gd_xbm.lo  -MMD -MF libgd/gd_xbm.dep -MT libgd/gd_xbm.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_webp.c -MMD -MF libgd/gd_webp.dep -MT libgd/gd_webp.lo  -fPIC -DPIC -o libgd/.libs/gd_webp.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_xbm.c -MMD -MF libgd/gd_xbm.dep -MT libgd/gd_xbm.lo  -fPIC -DPIC -o libgd/.libs/gd_xbm.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd.c -o libgd/gd.lo  -MMD -MF libgd/gd.dep -MT libgd/gd.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd.c -MMD -MF libgd/gd.dep -MT libgd/gd.lo  -fPIC -DPIC -o libgd/.libs/gd.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdcache.c -o libgd/gdcache.lo  -MMD -MF libgd/gdcache.dep -MT libgd/gdcache.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdcache.c -MMD -MF libgd/gdcache.dep -MT libgd/gdcache.lo  -fPIC -DPIC -o libgd/.libs/gdcache.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontg.c -o libgd/gdfontg.lo  -MMD -MF libgd/gdfontg.dep -MT libgd/gdfontg.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontg.c -MMD -MF libgd/gdfontg.dep -MT libgd/gdfontg.lo  -fPIC -DPIC -o libgd/.libs/gdfontg.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontl.c -o libgd/gdfontl.lo  -MMD -MF libgd/gdfontl.dep -MT libgd/gdfontl.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontl.c -MMD -MF libgd/gdfontl.dep -MT libgd/gdfontl.lo  -fPIC -DPIC -o libgd/.libs/gdfontl.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontmb.c -o libgd/gdfontmb.lo  -MMD -MF libgd/gdfontmb.dep -MT libgd/gdfontmb.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontmb.c -MMD -MF libgd/gdfontmb.dep -MT libgd/gdfontmb.lo  -fPIC -DPIC -o libgd/.libs/gdfontmb.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfonts.c -o libgd/gdfonts.lo  -MMD -MF libgd/gdfonts.dep -MT libgd/gdfonts.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfonts.c -MMD -MF libgd/gdfonts.dep -MT libgd/gdfonts.lo  -fPIC -DPIC -o libgd/.libs/gdfonts.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontt.c -o libgd/gdfontt.lo  -MMD -MF libgd/gdfontt.dep -MT libgd/gdfontt.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontt.c -MMD -MF libgd/gdfontt.dep -MT libgd/gdfontt.lo  -fPIC -DPIC -o libgd/.libs/gdfontt.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdft.c -o libgd/gdft.lo  -MMD -MF libgd/gdft.dep -MT libgd/gdft.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdft.c -MMD -MF libgd/gdft.dep -MT libgd/gdft.lo  -fPIC -DPIC -o libgd/.libs/gdft.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdhelpers.c -o libgd/gdhelpers.lo  -MMD -MF libgd/gdhelpers.dep -MT libgd/gdhelpers.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdhelpers.c -MMD -MF libgd/gdhelpers.dep -MT libgd/gdhelpers.lo  -fPIC -DPIC -o libgd/.libs/gdhelpers.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdkanji.c -o libgd/gdkanji.lo  -MMD -MF libgd/gdkanji.dep -MT libgd/gdkanji.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdkanji.c -MMD -MF libgd/gdkanji.dep -MT libgd/gdkanji.lo  -fPIC -DPIC -o libgd/.libs/gdkanji.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdtables.c -o libgd/gdtables.lo  -MMD -MF libgd/gdtables.dep -MT libgd/gdtables.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdtables.c -MMD -MF libgd/gdtables.dep -MT libgd/gdtables.lo  -fPIC -DPIC -o libgd/.libs/gdtables.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdxpm.c -o libgd/gdxpm.lo  -MMD -MF libgd/gdxpm.dep -MT libgd/gdxpm.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdxpm.c -MMD -MF libgd/gdxpm.dep -MT libgd/gdxpm.lo  -fPIC -DPIC -o libgd/.libs/gdxpm.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/wbmp.c -o libgd/wbmp.lo  -MMD -MF libgd/wbmp.dep -MT libgd/wbmp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/wbmp.c -MMD -MF libgd/wbmp.dep -MT libgd/wbmp.lo  -fPIC -DPIC -o libgd/.libs/wbmp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o gd.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/gd/modules  gd.lo libgd/gd_avif.lo libgd/gd_bmp.lo libgd/gd_color_match.lo libgd/gd_crop.lo libgd/gd_filter.lo libgd/gd_gd.lo libgd/gd_gd2.lo libgd/gd_gif_in.lo libgd/gd_gif_out.lo libgd/gd_interpolation.lo libgd/gd_io_dp.lo libgd/gd_io_file.lo libgd/gd_io_ss.lo libgd/gd_io.lo libgd/gd_jpeg.lo libgd/gd_matrix.lo libgd/gd_pixelate.lo libgd/gd_png.lo libgd/gd_rotate.lo libgd/gd_security.lo libgd/gd_ss.lo libgd/gd_tga.lo libgd/gd_topal.lo libgd/gd_transform.lo libgd/gd_wbmp.lo libgd/gd_webp.lo libgd/gd_xbm.lo libgd/gd.lo libgd/gdcache.lo libgd/gdfontg.lo libgd/gdfontl.lo libgd/gdfontmb.lo libgd/gdfonts.lo libgd/gdfontt.lo libgd/gdft.lo libgd/gdhelpers.lo libgd/gdkanji.lo libgd/gdtables.lo libgd/gdxpm.lo libgd/wbmp.lo -lz -lpng16 -ljpeg -lfreetype
cc -shared  .libs/gd.o libgd/.libs/gd_avif.o libgd/.libs/gd_bmp.o libgd/.libs/gd_color_match.o libgd/.libs/gd_crop.o libgd/.libs/gd_filter.o libgd/.libs/gd_gd.o libgd/.libs/gd_gd2.o libgd/.libs/gd_gif_in.o libgd/.libs/gd_gif_out.o libgd/.libs/gd_interpolation.o libgd/.libs/gd_io_dp.o libgd/.libs/gd_io_file.o libgd/.libs/gd_io_ss.o libgd/.libs/gd_io.o libgd/.libs/gd_jpeg.o libgd/.libs/gd_matrix.o libgd/.libs/gd_pixelate.o libgd/.libs/gd_png.o libgd/.libs/gd_rotate.o libgd/.libs/gd_security.o libgd/.libs/gd_ss.o libgd/.libs/gd_tga.o libgd/.libs/gd_topal.o libgd/.libs/gd_transform.o libgd/.libs/gd_wbmp.o libgd/.libs/gd_webp.o libgd/.libs/gd_xbm.o libgd/.libs/gd.o libgd/.libs/gdcache.o libgd/.libs/gdfontg.o libgd/.libs/gdfontl.o libgd/.libs/gdfontmb.o libgd/.libs/gdfonts.o libgd/.libs/gdfontt.o libgd/.libs/gdft.o libgd/.libs/gdhelpers.o libgd/.libs/gdkanji.o libgd/.libs/gdtables.o libgd/.libs/gdxpm.o libgd/.libs/wbmp.o  -lz -lpng16 -ljpeg -lfreetype  -Wl,-O1 -Wl,-soname -Wl,gd.so -o .libs/gd.so
creating gd.la
(cd .libs && rm -f gd.la && ln -s ../gd.la gd.la)
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=install cp ./gd.la /usr/src/php/ext/gd/modules
cp ./.libs/gd.so /usr/src/php/ext/gd/modules/gd.so
cp ./.libs/gd.lai /usr/src/php/ext/gd/modules/gd.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/gd/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/gd/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/gd.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
Installing header files:          /usr/local/include/php/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking whether to enable PDO support... yes, shared
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo.c -o pdo.lo  -MMD -MF pdo.dep -MT pdo.lo
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_dbh.c -o pdo_dbh.lo  -MMD -MF pdo_dbh.dep -MT pdo_dbh.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_dbh.c -MMD -MF pdo_dbh.dep -MT pdo_dbh.lo  -fPIC -DPIC -o .libs/pdo_dbh.o
 cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo.c -MMD -MF pdo.dep -MT pdo.lo  -fPIC -DPIC -o .libs/pdo.o
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_stmt.c -o pdo_stmt.lo  -MMD -MF pdo_stmt.dep -MT pdo_stmt.lo
 cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_stmt.c -MMD -MF pdo_stmt.dep -MT pdo_stmt.lo  -fPIC -DPIC -o .libs/pdo_stmt.o
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_sql_parser.c -o pdo_sql_parser.lo  -MMD -MF pdo_sql_parser.dep -MT pdo_sql_parser.lo
 cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_sql_parser.c -MMD -MF pdo_sql_parser.dep -MT pdo_sql_parser.lo  -fPIC -DPIC -o .libs/pdo_sql_parser.o
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_sqlstate.c -o pdo_sqlstate.lo  -MMD -MF pdo_sqlstate.dep -MT pdo_sqlstate.lo
 cc -I. -I/usr/src/php/ext/pdo -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo/pdo_sqlstate.c -MMD -MF pdo_sqlstate.dep -MT pdo_sqlstate.lo  -fPIC -DPIC -o .libs/pdo_sqlstate.o
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o pdo.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/pdo/modules  pdo.lo pdo_dbh.lo pdo_stmt.lo pdo_sql_parser.lo pdo_sqlstate.lo 
cc -shared  .libs/pdo.o .libs/pdo_dbh.o .libs/pdo_stmt.o .libs/pdo_sql_parser.o .libs/pdo_sqlstate.o   -Wl,-O1 -Wl,-soname -Wl,pdo.so -o .libs/pdo.so
creating pdo.la
(cd .libs && rm -f pdo.la && ln -s ../pdo.la pdo.la)
/bin/sh /usr/src/php/ext/pdo/libtool --tag=CC --mode=install cp ./pdo.la /usr/src/php/ext/pdo/modules
cp ./.libs/pdo.so /usr/src/php/ext/pdo/modules/pdo.so
cp ./.libs/pdo.lai /usr/src/php/ext/pdo/modules/pdo.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/pdo/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/pdo/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/pdo.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
Installing header files:          /usr/local/include/php/
warning: pdo (pdo) is already loaded!
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking for PostgreSQL support for PDO... yes, shared
checking for libpq >= 10.0... yes
checking for PQencryptPasswordConn in -lpq... yes
checking for PQresultMemorySize in -lpq... yes
checking for PQclosePrepared in -lpq... yes
checking for PDO includes... /usr/local/include/php/ext
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/pdo_pgsql/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pdo_pgsql.c -o pdo_pgsql.lo  -MMD -MF pdo_pgsql.dep -MT pdo_pgsql.lo
/bin/sh /usr/src/php/ext/pdo_pgsql/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pgsql_driver.c -o pgsql_driver.lo  -MMD -MF pgsql_driver.dep -MT pgsql_driver.lo
mkdir .libs
mkdir .libs
mkdir: can't create directory '.libs': File exists
 cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pgsql_driver.c -MMD -MF pgsql_driver.dep -MT pgsql_driver.lo  -fPIC -DPIC -o .libs/pgsql_driver.o
 cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pdo_pgsql.c -MMD -MF pdo_pgsql.dep -MT pdo_pgsql.lo  -fPIC -DPIC -o .libs/pdo_pgsql.o
/bin/sh /usr/src/php/ext/pdo_pgsql/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pgsql_statement.c -o pgsql_statement.lo  -MMD -MF pgsql_statement.dep -MT pgsql_statement.lo
 cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pgsql_statement.c -MMD -MF pgsql_statement.dep -MT pgsql_statement.lo  -fPIC -DPIC -o .libs/pgsql_statement.o
/bin/sh /usr/src/php/ext/pdo_pgsql/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pgsql_sql_parser.c -o pgsql_sql_parser.lo  -MMD -MF pgsql_sql_parser.dep -MT pgsql_sql_parser.lo
 cc -I. -I/usr/src/php/ext/pdo_pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pdo_pgsql/pgsql_sql_parser.c -MMD -MF pgsql_sql_parser.dep -MT pgsql_sql_parser.lo  -fPIC -DPIC -o .libs/pgsql_sql_parser.o
/bin/sh /usr/src/php/ext/pdo_pgsql/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o pdo_pgsql.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/pdo_pgsql/modules  pdo_pgsql.lo pgsql_driver.lo pgsql_statement.lo pgsql_sql_parser.lo -lpq
cc -shared  .libs/pdo_pgsql.o .libs/pgsql_driver.o .libs/pgsql_statement.o .libs/pgsql_sql_parser.o  -lpq  -Wl,-O1 -Wl,-soname -Wl,pdo_pgsql.so -o .libs/pdo_pgsql.so
creating pdo_pgsql.la
(cd .libs && rm -f pdo_pgsql.la && ln -s ../pdo_pgsql.la pdo_pgsql.la)
/bin/sh /usr/src/php/ext/pdo_pgsql/libtool --tag=CC --mode=install cp ./pdo_pgsql.la /usr/src/php/ext/pdo_pgsql/modules
cp ./.libs/pdo_pgsql.so /usr/src/php/ext/pdo_pgsql/modules/pdo_pgsql.so
cp ./.libs/pdo_pgsql.lai /usr/src/php/ext/pdo_pgsql/modules/pdo_pgsql.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/pdo_pgsql/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/pdo_pgsql/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/pdo_pgsql.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking for PostgreSQL support... yes, shared
checking for libpq >= 10.0... yes
checking for PQencryptPasswordConn in -lpq... yes
checking for PQresultMemorySize in -lpq... yes
checking for PQchangePassword in -lpq... yes
checking for PQsocketPoll in -lpq... yes
checking for cc options to detect undeclared functions... none needed
checking for cc options to ignore future-version functions... none needed
checking whether PGRES_TUPLES_CHUNK is declared... yes
checking for PQsetChunkedRowsMode in -lpq... yes
checking if PGVerbosity enum has PQERRORS_SQLSTATE... yes
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/pgsql/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pgsql/pgsql.c -o pgsql.lo  -MMD -MF pgsql.dep -MT pgsql.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/pgsql -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pgsql/pgsql.c -MMD -MF pgsql.dep -MT pgsql.lo  -fPIC -DPIC -o .libs/pgsql.o
/bin/sh /usr/src/php/ext/pgsql/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/postgresql  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o pgsql.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/pgsql/modules  pgsql.lo -lpq
cc -shared  .libs/pgsql.o  -lpq  -Wl,-O1 -Wl,-soname -Wl,pgsql.so -o .libs/pgsql.so
creating pgsql.la
(cd .libs && rm -f pgsql.la && ln -s ../pgsql.la pgsql.la)
/bin/sh /usr/src/php/ext/pgsql/libtool --tag=CC --mode=install cp ./pgsql.la /usr/src/php/ext/pgsql/modules
cp ./.libs/pgsql.so /usr/src/php/ext/pgsql/modules/pgsql.so
cp ./.libs/pgsql.lai /usr/src/php/ext/pgsql/modules/pgsql.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/pgsql/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/pgsql/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/pgsql.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking for zip archive read/write support... yes, shared
checking for libzip >= 0.11 libzip != 1.3.1 libzip != 1.7.0... yes
checking for zip_file_set_mtime in -lzip... yes
checking for zip_file_set_encryption in -lzip... yes
checking for zip_libzip_version in -lzip... yes
checking for zip_register_progress_callback_with_state in -lzip... yes
checking for zip_register_cancel_callback_with_state in -lzip... yes
checking for zip_compression_method_supported in -lzip... yes
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/zip/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/zip -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/zip/php_zip.c -o php_zip.lo  -MMD -MF php_zip.dep -MT php_zip.lo
/bin/sh /usr/src/php/ext/zip/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/zip -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/zip/zip_stream.c -o zip_stream.lo  -MMD -MF zip_stream.dep -MT zip_stream.lo
mkdir .libs
mkdir .libs
mkdir: can't create directory '.libs': File exists
 cc -I. -I/usr/src/php/ext/zip -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/zip/zip_stream.c -MMD -MF zip_stream.dep -MT zip_stream.lo  -fPIC -DPIC -o .libs/zip_stream.o
 cc -I. -I/usr/src/php/ext/zip -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/zip/php_zip.c -MMD -MF php_zip.dep -MT php_zip.lo  -fPIC -DPIC -o .libs/php_zip.o
/bin/sh /usr/src/php/ext/zip/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o zip.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/zip/modules  php_zip.lo zip_stream.lo -lzip
cc -shared  .libs/php_zip.o .libs/zip_stream.o  -lzip  -Wl,-O1 -Wl,-soname -Wl,zip.so -o .libs/zip.so
creating zip.la
(cd .libs && rm -f zip.la && ln -s ../zip.la zip.la)
/bin/sh /usr/src/php/ext/zip/libtool --tag=CC --mode=install cp ./zip.la /usr/src/php/ext/zip/modules
cp ./.libs/zip.so /usr/src/php/ext/zip/modules/zip.so
cp ./.libs/zip.lai /usr/src/php/ext/zip/modules/zip.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/zip/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/zip/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/zip.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking whether to enable pcntl support... yes, shared
checking for fork... yes
checking for sigaction... yes
checking for waitpid... yes
checking for forkx... no
checking for getcpuid... no
checking for getpriority... yes
checking for pidfd_open... no
checking for pset_bind... no
checking for pthread_set_qos_class_self_np... no
checking for rfork... no
checking for sched_setaffinity... yes
checking for setpriority... yes
checking for sigwaitinfo... yes
checking for sigtimedwait... yes
checking for unshare... yes
checking for wait3... yes
checking for wait4... yes
checking for waitid... yes
checking for cc options to detect undeclared functions... none needed
checking for cc options to ignore future-version functions... none needed
checking for WIFCONTINUED... no
checking whether WIFCONTINUED is declared... yes
checking whether WCONTINUED is declared... yes
checking whether WEXITED is declared... yes
checking whether WSTOPPED is declared... yes
checking whether WNOWAIT is declared... yes
checking whether P_ALL is declared... yes
checking whether P_PIDFD is declared... yes
checking whether P_UID is declared... no
checking whether P_JAILID is declared... no
checking if sched_getcpu is supported... no
checking for siginfo_t... yes
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/pcntl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pcntl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DHAVE_STRUCT_SIGINFO_T -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pcntl/pcntl.c -o pcntl.lo  -MMD -MF pcntl.dep -MT pcntl.lo
/bin/sh /usr/src/php/ext/pcntl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/pcntl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DHAVE_STRUCT_SIGINFO_T -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pcntl/php_signal.c -o php_signal.lo  -MMD -MF php_signal.dep -MT php_signal.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/pcntl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DHAVE_STRUCT_SIGINFO_T -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pcntl/pcntl.c -MMD -MF pcntl.dep -MT pcntl.lo  -fPIC -DPIC -o .libs/pcntl.o
 cc -I. -I/usr/src/php/ext/pcntl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DHAVE_STRUCT_SIGINFO_T -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/pcntl/php_signal.c -MMD -MF php_signal.dep -MT php_signal.lo  -fPIC -DPIC -o .libs/php_signal.o
/bin/sh /usr/src/php/ext/pcntl/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o pcntl.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/pcntl/modules  pcntl.lo php_signal.lo 
cc -shared  .libs/pcntl.o .libs/php_signal.o   -Wl,-O1 -Wl,-soname -Wl,pcntl.so -o .libs/pcntl.so
creating pcntl.la
(cd .libs && rm -f pcntl.la && ln -s ../pcntl.la pcntl.la)
/bin/sh /usr/src/php/ext/pcntl/libtool --tag=CC --mode=install cp ./pcntl.la /usr/src/php/ext/pcntl/modules
cp ./.libs/pcntl.so /usr/src/php/ext/pcntl/modules/pcntl.so
cp ./.libs/pcntl.lai /usr/src/php/ext/pcntl/modules/pcntl.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/pcntl/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/pcntl/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/pcntl.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking whether to enable POSIX-like functions... yes, shared
checking for ctermid... yes
checking for eaccess... yes
checking for getgrgid_r... yes
checking for getgroups... yes
checking for getpgid... yes
checking for getrlimit... yes
checking for getsid... yes
checking for initgroups... yes
checking for mkfifo... yes
checking for mknod... yes
checking for setegid... yes
checking for seteuid... yes
checking for setrlimit... yes
checking for setsid... yes
checking for cc options to detect undeclared functions... none needed
checking for cc options to ignore future-version functions... none needed
checking for makedev... no
checking whether makedev is declared... no
checking for working ttyname_r() implementation... yes
checking for struct utsname.domainname... yes
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/posix/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/posix -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/posix/posix.c -o posix.lo  -MMD -MF posix.dep -MT posix.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/posix -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/posix/posix.c -MMD -MF posix.dep -MT posix.lo  -fPIC -DPIC -o .libs/posix.o
/bin/sh /usr/src/php/ext/posix/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o posix.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/posix/modules  posix.lo 
cc -shared  .libs/posix.o   -Wl,-O1 -Wl,-soname -Wl,posix.so -o .libs/posix.so
creating posix.la
(cd .libs && rm -f posix.la && ln -s ../posix.la posix.la)
/bin/sh /usr/src/php/ext/posix/libtool --tag=CC --mode=install cp ./posix.la /usr/src/php/ext/posix/modules
cp ./.libs/posix.so /usr/src/php/ext/posix/modules/posix.so
cp ./.libs/posix.lai /usr/src/php/ext/posix/modules/posix.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/posix/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/posix/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/posix.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
warning: posix (posix) is already loaded!
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking whether to enable Zend OPcache support... yes, shared
checking whether to enable copying PHP CODE pages into HUGE PAGES... yes
checking whether to enable JIT... yes
checking whether to support opcache JIT disassembly through Capstone... no
checking for mprotect... yes
checking for shm_create_largepage... no
checking for sysvipc shared memory support... yes
checking for mmap() using MAP_ANON shared memory support... yes
checking for library containing shm_open... none required
checking for mmap() using shm_open() shared memory support... yes
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/shared_alloc_mmap.c -o shared_alloc_mmap.lo  -MMD -MF shared_alloc_mmap.dep -MT shared_alloc_mmap.lo
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/shared_alloc_posix.c -o shared_alloc_posix.lo  -MMD -MF shared_alloc_posix.dep -MT shared_alloc_posix.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/shared_alloc_mmap.c -MMD -MF shared_alloc_mmap.dep -MT shared_alloc_mmap.lo  -fPIC -DPIC -o .libs/shared_alloc_mmap.o
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/shared_alloc_posix.c -MMD -MF shared_alloc_posix.dep -MT shared_alloc_posix.lo  -fPIC -DPIC -o .libs/shared_alloc_posix.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/shared_alloc_shm.c -o shared_alloc_shm.lo  -MMD -MF shared_alloc_shm.dep -MT shared_alloc_shm.lo
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_blacklist.c -o zend_accelerator_blacklist.lo  -MMD -MF zend_accelerator_blacklist.dep -MT zend_accelerator_blacklist.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/shared_alloc_shm.c -MMD -MF shared_alloc_shm.dep -MT shared_alloc_shm.lo  -fPIC -DPIC -o .libs/shared_alloc_shm.o
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_blacklist.c -MMD -MF zend_accelerator_blacklist.dep -MT zend_accelerator_blacklist.lo  -fPIC -DPIC -o .libs/zend_accelerator_blacklist.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_debug.c -o zend_accelerator_debug.lo  -MMD -MF zend_accelerator_debug.dep -MT zend_accelerator_debug.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_debug.c -MMD -MF zend_accelerator_debug.dep -MT zend_accelerator_debug.lo  -fPIC -DPIC -o .libs/zend_accelerator_debug.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_hash.c -o zend_accelerator_hash.lo  -MMD -MF zend_accelerator_hash.dep -MT zend_accelerator_hash.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_hash.c -MMD -MF zend_accelerator_hash.dep -MT zend_accelerator_hash.lo  -fPIC -DPIC -o .libs/zend_accelerator_hash.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_module.c -o zend_accelerator_module.lo  -MMD -MF zend_accelerator_module.dep -MT zend_accelerator_module.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_module.c -MMD -MF zend_accelerator_module.dep -MT zend_accelerator_module.lo  -fPIC -DPIC -o .libs/zend_accelerator_module.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_util_funcs.c -o zend_accelerator_util_funcs.lo  -MMD -MF zend_accelerator_util_funcs.dep -MT zend_accelerator_util_funcs.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_accelerator_util_funcs.c -MMD -MF zend_accelerator_util_funcs.dep -MT zend_accelerator_util_funcs.lo  -fPIC -DPIC -o .libs/zend_accelerator_util_funcs.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_file_cache.c -o zend_file_cache.lo  -MMD -MF zend_file_cache.dep -MT zend_file_cache.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_file_cache.c -MMD -MF zend_file_cache.dep -MT zend_file_cache.lo  -fPIC -DPIC -o .libs/zend_file_cache.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_persist_calc.c -o zend_persist_calc.lo  -MMD -MF zend_persist_calc.dep -MT zend_persist_calc.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_persist_calc.c -MMD -MF zend_persist_calc.dep -MT zend_persist_calc.lo  -fPIC -DPIC -o .libs/zend_persist_calc.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_persist.c -o zend_persist.lo  -MMD -MF zend_persist.dep -MT zend_persist.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_persist.c -MMD -MF zend_persist.dep -MT zend_persist.lo  -fPIC -DPIC -o .libs/zend_persist.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_shared_alloc.c -o zend_shared_alloc.lo  -MMD -MF zend_shared_alloc.dep -MT zend_shared_alloc.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/zend_shared_alloc.c -MMD -MF zend_shared_alloc.dep -MT zend_shared_alloc.lo  -fPIC -DPIC -o .libs/zend_shared_alloc.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/ZendAccelerator.c -o ZendAccelerator.lo  -MMD -MF ZendAccelerator.dep -MT ZendAccelerator.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/ZendAccelerator.c -MMD -MF ZendAccelerator.dep -MT ZendAccelerator.lo  -fPIC -DPIC -o .libs/ZendAccelerator.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_cfg.c -o jit/ir/ir_cfg.lo  -MMD -MF jit/ir/ir_cfg.dep -MT jit/ir/ir_cfg.lo
mkdir jit/ir/.libs
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_cfg.c -MMD -MF jit/ir/ir_cfg.dep -MT jit/ir/ir_cfg.lo  -fPIC -DPIC -o jit/ir/.libs/ir_cfg.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_check.c -o jit/ir/ir_check.lo  -MMD -MF jit/ir/ir_check.dep -MT jit/ir/ir_check.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_check.c -MMD -MF jit/ir/ir_check.dep -MT jit/ir/ir_check.lo  -fPIC -DPIC -o jit/ir/.libs/ir_check.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_dump.c -o jit/ir/ir_dump.lo  -MMD -MF jit/ir/ir_dump.dep -MT jit/ir/ir_dump.lo
cc /usr/src/php/ext/opcache/jit/ir/dynasm/minilua.c -lm -o jit/ir/minilua
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_dump.c -MMD -MF jit/ir/ir_dump.dep -MT jit/ir/ir_dump.lo  -fPIC -DPIC -o jit/ir/.libs/ir_dump.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_gcm.c -o jit/ir/ir_gcm.lo  -MMD -MF jit/ir/ir_gcm.dep -MT jit/ir/ir_gcm.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_gcm.c -MMD -MF jit/ir/ir_gcm.dep -MT jit/ir/ir_gcm.lo  -fPIC -DPIC -o jit/ir/.libs/ir_gcm.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_gdb.c -o jit/ir/ir_gdb.lo  -MMD -MF jit/ir/ir_gdb.dep -MT jit/ir/ir_gdb.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_gdb.c -MMD -MF jit/ir/ir_gdb.dep -MT jit/ir/ir_gdb.lo  -fPIC -DPIC -o jit/ir/.libs/ir_gdb.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_patch.c -o jit/ir/ir_patch.lo  -MMD -MF jit/ir/ir_patch.dep -MT jit/ir/ir_patch.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_patch.c -MMD -MF jit/ir/ir_patch.dep -MT jit/ir/ir_patch.lo  -fPIC -DPIC -o jit/ir/.libs/ir_patch.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_perf.c -o jit/ir/ir_perf.lo  -MMD -MF jit/ir/ir_perf.dep -MT jit/ir/ir_perf.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_perf.c -MMD -MF jit/ir/ir_perf.dep -MT jit/ir/ir_perf.lo  -fPIC -DPIC -o jit/ir/.libs/ir_perf.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_ra.c -o jit/ir/ir_ra.lo  -MMD -MF jit/ir/ir_ra.dep -MT jit/ir/ir_ra.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_ra.c -MMD -MF jit/ir/ir_ra.dep -MT jit/ir/ir_ra.lo  -fPIC -DPIC -o jit/ir/.libs/ir_ra.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_save.c -o jit/ir/ir_save.lo  -MMD -MF jit/ir/ir_save.dep -MT jit/ir/ir_save.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_save.c -MMD -MF jit/ir/ir_save.dep -MT jit/ir/ir_save.lo  -fPIC -DPIC -o jit/ir/.libs/ir_save.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_sccp.c -o jit/ir/ir_sccp.lo  -MMD -MF jit/ir/ir_sccp.dep -MT jit/ir/ir_sccp.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_sccp.c -MMD -MF jit/ir/ir_sccp.dep -MT jit/ir/ir_sccp.lo  -fPIC -DPIC -o jit/ir/.libs/ir_sccp.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_strtab.c -o jit/ir/ir_strtab.lo  -MMD -MF jit/ir/ir_strtab.dep -MT jit/ir/ir_strtab.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_strtab.c -MMD -MF jit/ir/ir_strtab.dep -MT jit/ir/ir_strtab.lo  -fPIC -DPIC -o jit/ir/.libs/ir_strtab.o
cc -DIR_TARGET_X64 -DIR_PHP -DIR_PHP_MM=0 -o jit/ir/gen_ir_fold_hash /usr/src/php/ext/opcache/jit/ir/gen_ir_fold_hash.c
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/zend_jit_vm_helpers.c -o jit/zend_jit_vm_helpers.lo  -MMD -MF jit/zend_jit_vm_helpers.dep -MT jit/zend_jit_vm_helpers.lo
make: Circular jit/zend_jit.lo <- jit/zend_jit.lo dependency dropped.
mkdir jit/.libs
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/zend_jit_vm_helpers.c -MMD -MF jit/zend_jit_vm_helpers.dep -MT jit/zend_jit_vm_helpers.lo  -fPIC -DPIC -o jit/.libs/zend_jit_vm_helpers.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/zend_jit.c -o jit/zend_jit.lo  -MMD -MF jit/zend_jit.dep -MT jit/zend_jit.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/zend_jit.c -MMD -MF jit/zend_jit.dep -MT jit/zend_jit.lo  -fPIC -DPIC -o jit/.libs/zend_jit.o
./jit/ir/minilua /usr/src/php/ext/opcache/jit/ir/dynasm/dynasm.lua  -D X64=1 -o jit/ir/ir_emit_x86.h /usr/src/php/ext/opcache/jit/ir/ir_x86.dasc
./jit/ir/gen_ir_fold_hash < /usr/src/php/ext/opcache/jit/ir/ir_fold.h > ./jit/ir/ir_fold_hash.h
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_emit.c -o jit/ir/ir_emit.lo  -MMD -MF jit/ir/ir_emit.dep -MT jit/ir/ir_emit.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir_emit.c -MMD -MF jit/ir/ir_emit.dep -MT jit/ir/ir_emit.lo  -fPIC -DPIC -o jit/ir/.libs/ir_emit.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir.c -o jit/ir/ir.lo  -MMD -MF jit/ir/ir.dep -MT jit/ir/ir.lo
 cc -I. -I/usr/src/php/ext/opcache -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -I./jit/ir -DIR_TARGET_X64 -DIR_PHP -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/opcache/jit/ir/ir.c -MMD -MF jit/ir/ir.dep -MT jit/ir/ir.lo  -fPIC -DPIC -o jit/ir/.libs/ir.o
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o opcache.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/opcache/modules  shared_alloc_mmap.lo shared_alloc_posix.lo shared_alloc_shm.lo zend_accelerator_blacklist.lo zend_accelerator_debug.lo zend_accelerator_hash.lo zend_accelerator_module.lo zend_accelerator_util_funcs.lo zend_file_cache.lo zend_persist_calc.lo zend_persist.lo zend_shared_alloc.lo ZendAccelerator.lo jit/ir/ir_cfg.lo jit/ir/ir_check.lo jit/ir/ir_dump.lo jit/ir/ir_emit.lo jit/ir/ir_gcm.lo jit/ir/ir_gdb.lo jit/ir/ir_patch.lo jit/ir/ir_perf.lo jit/ir/ir_ra.lo jit/ir/ir_save.lo jit/ir/ir_sccp.lo jit/ir/ir_strtab.lo jit/ir/ir.lo jit/zend_jit_vm_helpers.lo jit/zend_jit.lo 
cc -shared  .libs/shared_alloc_mmap.o .libs/shared_alloc_posix.o .libs/shared_alloc_shm.o .libs/zend_accelerator_blacklist.o .libs/zend_accelerator_debug.o .libs/zend_accelerator_hash.o .libs/zend_accelerator_module.o .libs/zend_accelerator_util_funcs.o .libs/zend_file_cache.o .libs/zend_persist_calc.o .libs/zend_persist.o .libs/zend_shared_alloc.o .libs/ZendAccelerator.o jit/ir/.libs/ir_cfg.o jit/ir/.libs/ir_check.o jit/ir/.libs/ir_dump.o jit/ir/.libs/ir_emit.o jit/ir/.libs/ir_gcm.o jit/ir/.libs/ir_gdb.o jit/ir/.libs/ir_patch.o jit/ir/.libs/ir_perf.o jit/ir/.libs/ir_ra.o jit/ir/.libs/ir_save.o jit/ir/.libs/ir_sccp.o jit/ir/.libs/ir_strtab.o jit/ir/.libs/ir.o jit/.libs/zend_jit_vm_helpers.o jit/.libs/zend_jit.o   -Wl,-O1 -Wl,-soname -Wl,opcache.so -o .libs/opcache.so
creating opcache.la
(cd .libs && rm -f opcache.la && ln -s ../opcache.la opcache.la)
/bin/sh /usr/src/php/ext/opcache/libtool --tag=CC --mode=install cp ./opcache.la /usr/src/php/ext/opcache/modules
cp ./.libs/opcache.so /usr/src/php/ext/opcache/modules/opcache.so
cp ./.libs/opcache.lai /usr/src/php/ext/opcache/modules/opcache.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/opcache/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/opcache/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/opcache.so
make: Circular jit/zend_jit.lo <- jit/zend_jit.lo dependency dropped.
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for a sed that does not truncate output... /bin/sed
checking build system type... x86_64-pc-linux-musl
checking host system type... x86_64-pc-linux-musl
checking target system type... x86_64-pc-linux-musl
shtool:echo:Warning: unable to determine terminal sequence for bold mode
shtool:echo:Warning: unable to determine terminal sequence for bold mode
checking for gawk... no
checking for nawk... no
checking for awk... awk
checking if awk is broken... no
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables... 
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether the compiler supports GNU C... yes
checking whether cc accepts -g... yes
checking for cc option to enable C23 features... unsupported
checking for cc option to enable C11 features... none needed
checking how to run the C preprocessor... cc -E
checking for egrep -e... (cached) /bin/grep -E
checking for icc... no
checking for suncc... no
checking for system library directory... lib
checking if compiler supports -Wl,-rpath,... yes
checking for PHP prefix... /usr/local
checking for PHP includes... -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib
checking for PHP extension directory... /usr/local/lib/php/extensions/no-debug-zts-20240924
checking for PHP installed headers prefix... /usr/local/include/php
checking if debugging is enabled... no
checking if PHP is built with thread safety (ZTS)... yes
Configuring extension
checking whether to enable bc style precision math functions... yes, shared
Configuring libtool
checking for a sed that does not truncate output... /bin/sed
checking for ld used by cc... /usr/x86_64-alpine-linux-musl/bin/ld
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld) is GNU ld... yes
checking for /usr/x86_64-alpine-linux-musl/bin/ld option to reload object files... -r
checking for BSD-compatible nm... /usr/bin/nm -B
checking whether ln -s works... yes
checking how to recognize dependent libraries... pass_all
checking for stdio.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for strings.h... yes
checking for sys/stat.h... yes
checking for sys/types.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking the maximum length of command line arguments... 98304
checking command to parse /usr/bin/nm -B output from cc object... ok
checking for objdir... .libs
checking for ar... ar
checking for ranlib... ranlib
checking for strip... strip
checking if cc supports -fno-rtti -fno-exceptions... no
checking for cc option to produce PIC... -fPIC
checking if cc PIC flag -fPIC works... yes
checking if cc static flag -static works... yes
checking if cc supports -c -o file.o... yes
checking whether the cc linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... no
creating libtool
appending configuration tag "CXX" to libtool
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/bcmath.c -o bcmath.lo  -MMD -MF bcmath.dep -MT bcmath.lo
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/add.c -o libbcmath/src/add.lo  -MMD -MF libbcmath/src/add.dep -MT libbcmath/src/add.lo
mkdir libbcmath/src/.libs
mkdir .libs
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/add.c -MMD -MF libbcmath/src/add.dep -MT libbcmath/src/add.lo  -fPIC -DPIC -o libbcmath/src/.libs/add.o
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/bcmath.c -MMD -MF bcmath.dep -MT bcmath.lo  -fPIC -DPIC -o .libs/bcmath.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/compare.c -o libbcmath/src/compare.lo  -MMD -MF libbcmath/src/compare.dep -MT libbcmath/src/compare.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/compare.c -MMD -MF libbcmath/src/compare.dep -MT libbcmath/src/compare.lo  -fPIC -DPIC -o libbcmath/src/.libs/compare.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/convert.c -o libbcmath/src/convert.lo  -MMD -MF libbcmath/src/convert.dep -MT libbcmath/src/convert.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/convert.c -MMD -MF libbcmath/src/convert.dep -MT libbcmath/src/convert.lo  -fPIC -DPIC -o libbcmath/src/.libs/convert.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/div.c -o libbcmath/src/div.lo  -MMD -MF libbcmath/src/div.dep -MT libbcmath/src/div.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/div.c -MMD -MF libbcmath/src/div.dep -MT libbcmath/src/div.lo  -fPIC -DPIC -o libbcmath/src/.libs/div.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/divmod.c -o libbcmath/src/divmod.lo  -MMD -MF libbcmath/src/divmod.dep -MT libbcmath/src/divmod.lo
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/doaddsub.c -o libbcmath/src/doaddsub.lo  -MMD -MF libbcmath/src/doaddsub.dep -MT libbcmath/src/doaddsub.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/divmod.c -MMD -MF libbcmath/src/divmod.dep -MT libbcmath/src/divmod.lo  -fPIC -DPIC -o libbcmath/src/.libs/divmod.o
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/doaddsub.c -MMD -MF libbcmath/src/doaddsub.dep -MT libbcmath/src/doaddsub.lo  -fPIC -DPIC -o libbcmath/src/.libs/doaddsub.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/floor_or_ceil.c -o libbcmath/src/floor_or_ceil.lo  -MMD -MF libbcmath/src/floor_or_ceil.dep -MT libbcmath/src/floor_or_ceil.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/floor_or_ceil.c -MMD -MF libbcmath/src/floor_or_ceil.dep -MT libbcmath/src/floor_or_ceil.lo  -fPIC -DPIC -o libbcmath/src/.libs/floor_or_ceil.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/long2num.c -o libbcmath/src/long2num.lo  -MMD -MF libbcmath/src/long2num.dep -MT libbcmath/src/long2num.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/long2num.c -MMD -MF libbcmath/src/long2num.dep -MT libbcmath/src/long2num.lo  -fPIC -DPIC -o libbcmath/src/.libs/long2num.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/init.c -o libbcmath/src/init.lo  -MMD -MF libbcmath/src/init.dep -MT libbcmath/src/init.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/init.c -MMD -MF libbcmath/src/init.dep -MT libbcmath/src/init.lo  -fPIC -DPIC -o libbcmath/src/.libs/init.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/int2num.c -o libbcmath/src/int2num.lo  -MMD -MF libbcmath/src/int2num.dep -MT libbcmath/src/int2num.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/int2num.c -MMD -MF libbcmath/src/int2num.dep -MT libbcmath/src/int2num.lo  -fPIC -DPIC -o libbcmath/src/.libs/int2num.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/nearzero.c -o libbcmath/src/nearzero.lo  -MMD -MF libbcmath/src/nearzero.dep -MT libbcmath/src/nearzero.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/nearzero.c -MMD -MF libbcmath/src/nearzero.dep -MT libbcmath/src/nearzero.lo  -fPIC -DPIC -o libbcmath/src/.libs/nearzero.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/neg.c -o libbcmath/src/neg.lo  -MMD -MF libbcmath/src/neg.dep -MT libbcmath/src/neg.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/neg.c -MMD -MF libbcmath/src/neg.dep -MT libbcmath/src/neg.lo  -fPIC -DPIC -o libbcmath/src/.libs/neg.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/num2long.c -o libbcmath/src/num2long.lo  -MMD -MF libbcmath/src/num2long.dep -MT libbcmath/src/num2long.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/num2long.c -MMD -MF libbcmath/src/num2long.dep -MT libbcmath/src/num2long.lo  -fPIC -DPIC -o libbcmath/src/.libs/num2long.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/num2str.c -o libbcmath/src/num2str.lo  -MMD -MF libbcmath/src/num2str.dep -MT libbcmath/src/num2str.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/num2str.c -MMD -MF libbcmath/src/num2str.dep -MT libbcmath/src/num2str.lo  -fPIC -DPIC -o libbcmath/src/.libs/num2str.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/raise.c -o libbcmath/src/raise.lo  -MMD -MF libbcmath/src/raise.dep -MT libbcmath/src/raise.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/raise.c -MMD -MF libbcmath/src/raise.dep -MT libbcmath/src/raise.lo  -fPIC -DPIC -o libbcmath/src/.libs/raise.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/raisemod.c -o libbcmath/src/raisemod.lo  -MMD -MF libbcmath/src/raisemod.dep -MT libbcmath/src/raisemod.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/raisemod.c -MMD -MF libbcmath/src/raisemod.dep -MT libbcmath/src/raisemod.lo  -fPIC -DPIC -o libbcmath/src/.libs/raisemod.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/recmul.c -o libbcmath/src/recmul.lo  -MMD -MF libbcmath/src/recmul.dep -MT libbcmath/src/recmul.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/recmul.c -MMD -MF libbcmath/src/recmul.dep -MT libbcmath/src/recmul.lo  -fPIC -DPIC -o libbcmath/src/.libs/recmul.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/rmzero.c -o libbcmath/src/rmzero.lo  -MMD -MF libbcmath/src/rmzero.dep -MT libbcmath/src/rmzero.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/rmzero.c -MMD -MF libbcmath/src/rmzero.dep -MT libbcmath/src/rmzero.lo  -fPIC -DPIC -o libbcmath/src/.libs/rmzero.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/round.c -o libbcmath/src/round.lo  -MMD -MF libbcmath/src/round.dep -MT libbcmath/src/round.lo
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/sqrt.c -o libbcmath/src/sqrt.lo  -MMD -MF libbcmath/src/sqrt.dep -MT libbcmath/src/sqrt.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/round.c -MMD -MF libbcmath/src/round.dep -MT libbcmath/src/round.lo  -fPIC -DPIC -o libbcmath/src/.libs/round.o
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/sqrt.c -MMD -MF libbcmath/src/sqrt.dep -MT libbcmath/src/sqrt.lo  -fPIC -DPIC -o libbcmath/src/.libs/sqrt.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/str2num.c -o libbcmath/src/str2num.lo  -MMD -MF libbcmath/src/str2num.dep -MT libbcmath/src/str2num.lo
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/sub.c -o libbcmath/src/sub.lo  -MMD -MF libbcmath/src/sub.dep -MT libbcmath/src/sub.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/str2num.c -MMD -MF libbcmath/src/str2num.dep -MT libbcmath/src/str2num.lo  -fPIC -DPIC -o libbcmath/src/.libs/str2num.o
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/sub.c -MMD -MF libbcmath/src/sub.dep -MT libbcmath/src/sub.lo  -fPIC -DPIC -o libbcmath/src/.libs/sub.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/zero.c -o libbcmath/src/zero.lo  -MMD -MF libbcmath/src/zero.dep -MT libbcmath/src/zero.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/zero.c -MMD -MF libbcmath/src/zero.dep -MT libbcmath/src/zero.lo  -fPIC -DPIC -o libbcmath/src/.libs/zero.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o bcmath.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/bcmath/modules  bcmath.lo libbcmath/src/add.lo libbcmath/src/compare.lo libbcmath/src/convert.lo libbcmath/src/div.lo libbcmath/src/divmod.lo libbcmath/src/doaddsub.lo libbcmath/src/floor_or_ceil.lo libbcmath/src/long2num.lo libbcmath/src/init.lo libbcmath/src/int2num.lo libbcmath/src/nearzero.lo libbcmath/src/neg.lo libbcmath/src/num2long.lo libbcmath/src/num2str.lo libbcmath/src/raise.lo libbcmath/src/raisemod.lo libbcmath/src/recmul.lo libbcmath/src/rmzero.lo libbcmath/src/round.lo libbcmath/src/sqrt.lo libbcmath/src/str2num.lo libbcmath/src/sub.lo libbcmath/src/zero.lo 
cc -shared  .libs/bcmath.o libbcmath/src/.libs/add.o libbcmath/src/.libs/compare.o libbcmath/src/.libs/convert.o libbcmath/src/.libs/div.o libbcmath/src/.libs/divmod.o libbcmath/src/.libs/doaddsub.o libbcmath/src/.libs/floor_or_ceil.o libbcmath/src/.libs/long2num.o libbcmath/src/.libs/init.o libbcmath/src/.libs/int2num.o libbcmath/src/.libs/nearzero.o libbcmath/src/.libs/neg.o libbcmath/src/.libs/num2long.o libbcmath/src/.libs/num2str.o libbcmath/src/.libs/raise.o libbcmath/src/.libs/raisemod.o libbcmath/src/.libs/recmul.o libbcmath/src/.libs/rmzero.o libbcmath/src/.libs/round.o libbcmath/src/.libs/sqrt.o libbcmath/src/.libs/str2num.o libbcmath/src/.libs/sub.o libbcmath/src/.libs/zero.o   -Wl,-O1 -Wl,-soname -Wl,bcmath.so -o .libs/bcmath.so
creating bcmath.la
(cd .libs && rm -f bcmath.la && ln -s ../bcmath.la bcmath.la)
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=install cp ./bcmath.la /usr/src/php/ext/bcmath/modules
cp ./.libs/bcmath.so /usr/src/php/ext/bcmath/modules/bcmath.so
cp ./.libs/bcmath.lai /usr/src/php/ext/bcmath/modules/bcmath.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/bcmath/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/bcmath/modules
If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,--rpath -Wl,LIBDIR' linker flag
See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
Build complete.
Don't forget to run 'make test'.
+ strip --strip-all modules/bcmath.so
Installing shared extensions:     /usr/local/lib/php/extensions/no-debug-zts-20240924/
find . -name \*.gcno -o -name \*.gcda | xargs rm -f
find . -name \*.lo -o -name \*.o -o -name \*.dep | xargs rm -f
find . -name \*.la -o -name \*.a | xargs rm -f
find . -name \*.so | xargs rm -f
find . -name .libs -a -type d|xargs rm -rf
rm -f libphp.la      modules/* libs/*
rm -f ext/opcache/jit/ir/gen_ir_fold_hash
rm -f ext/opcache/jit/ir/minilua
rm -f ext/opcache/jit/ir/ir_fold_hash.h
rm -f ext/opcache/jit/ir/ir_emit_x86.h
rm -f ext/opcache/jit/ir/ir_emit_aarch64.h
WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.24/main/x86_64/APKINDEX.tar.gz: No such file or directory
WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.24/community/x86_64/APKINDEX.tar.gz: No such file or directory
( 1/20) Purging .phpize-deps-configure (20260812.092839)
( 2/20) Purging autoconf (2.73-r0)
( 3/20) Purging m4 (1.4.20-r1)
( 4/20) Purging dpkg-dev (1.23.7-r0)
( 5/20) Purging perl (5.42.2-r0)
( 6/20) Purging dpkg (1.23.7-r0)
( 7/20) Purging file (5.47-r2)
( 8/20) Purging g++ (15.2.0-r5)
( 9/20) Purging gcc (15.2.0-r5)
(10/20) Purging binutils (2.45.1-r1)
(11/20) Purging libatomic (15.2.0-r5)
(12/20) Purging libgomp (15.2.0-r5)
(13/20) Purging make (4.4.1-r4)
(14/20) Purging re2c (4.5.1-r0)
(15/20) Purging isl26 (0.26-r2)
(16/20) Purging jansson (2.15.0-r0)
(17/20) Purging libmagic (5.47-r2)
(18/20) Purging mpc1 (1.3.1-r1)
(19/20) Purging mpfr4 (4.2.2-r0)
(20/20) Purging gmp (6.3.0-r4)
Executing busybox-1.37.0-r31.trigger
OK: 519.9 MiB in 116 packages
WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.24/main/x86_64/APKINDEX.tar.gz: No such file or directory
WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.24/community/x86_64/APKINDEX.tar.gz: No such file or directory
( 1/42) Purging freetype-dev (2.14.3-r0)
( 2/42) Purging libjpeg-turbo-dev (3.1.3-r0)
( 3/42) Purging libturbojpeg (3.1.3-r0)
( 4/42) Purging libpng-dev (1.6.58-r1)
( 5/42) Purging libzip-dev (1.11.4-r2)
( 6/42) Purging libzip-tools (1.11.4-r2)
( 7/42) Purging bzip2-dev (1.0.8-r6)
( 8/42) Purging xz-dev (5.8.3-r0)
( 9/42) Purging zlib-dev (1.3.2-r0)
(10/42) Purging libzip (1.11.4-r2)
(11/42) Purging linux-headers (7.0.0-r1)
(12/42) Purging postgresql18-dev (18.4-r0)
(13/42) Purging libecpg-dev (18.4-r0)
(14/42) Purging libecpg (18.4-r0)
(15/42) Purging liburing-dev (2.14-r0)
(16/42) Purging liburing-ffi (2.14-r0)
(17/42) Purging liburing (2.14-r0)
(18/42) Purging clang22 (22.1.3-r2)
(19/42) Purging fortify-headers (3.0.1-r2)
(20/42) Purging libgcc-static (15.2.0-r5)
(21/42) Purging libstdc++-dev (15.2.0-r5)
(22/42) Purging musl-dev (1.2.6-r2)
(23/42) Purging clang22-headers (22.1.3-r2)
(24/42) Purging icu-dev (78.1-r0)
(25/42) Purging llvm22 (22.1.3-r0)
(26/42) Purging llvm22-linker-tools (22.1.3-r0)
(27/42) Purging lz4-dev (1.10.0-r1)
(28/42) Purging lz4-libs (1.10.0-r1)
(29/42) Purging zstd-dev (1.5.7-r2)
(30/42) Purging zstd (1.5.7-r2)
(31/42) Purging brotli-dev (1.2.0-r1)
(32/42) Purging brotli (1.2.0-r1)
(33/42) Purging clang22-libs (22.1.3-r2)
(34/42) Purging icu (78.1-r0)
(35/42) Purging icu-libs (78.1-r0)
(36/42) Purging icu-data-en (78.1-r0)
(37/42) Purging llvm22-libs (22.1.3-r0)
(38/42) Purging libffi (3.5.2-r1)
(39/42) Purging libpq-dev (18.4-r0)
(40/42) Purging libpq (18.4-r0)
(41/42) Purging openssl-dev (3.5.7-r0)
(42/42) Purging pkgconf (2.5.1-r0)
Executing busybox-1.37.0-r31.trigger
OK: 42.5 MiB in 74 packages
Removing intermediate container 6c57f9357ab6
 ---> e6c60f325c06
Step 3/12 : RUN pecl install redis && docker-php-ext-enable redis
 ---> Running in 08d3780bd60a
Warning: PHP Startup: Unable to load dynamic library 'pdo_pgsql' (tried: /usr/local/lib/php/extensions/no-debug-zts-20240924/pdo_pgsql (Error loading shared library /usr/local/lib/php/extensions/no-debug-zts-20240924/pdo_pgsql: No such file or directory), /usr/local/lib/php/extensions/no-debug-zts-20240924/pdo_pgsql.so (Error loading shared library libpq.so.5: No such file or directory (needed by /usr/local/lib/php/extensions/no-debug-zts-20240924/pdo_pgsql.so))) in Unknown on line 0
Warning: PHP Startup: Unable to load dynamic library 'pgsql' (tried: /usr/local/lib/php/extensions/no-debug-zts-20240924/pgsql (Error loading shared library /usr/local/lib/php/extensions/no-debug-zts-20240924/pgsql: No such file or directory), /usr/local/lib/php/extensions/no-debug-zts-20240924/pgsql.so (Error loading shared library libpq.so.5: No such file or directory (needed by /usr/local/lib/php/extensions/no-debug-zts-20240924/pgsql.so))) in Unknown on line 0
Warning: PHP Startup: Unable to load dynamic library 'zip' (tried: /usr/local/lib/php/extensions/no-debug-zts-20240924/zip (Error loading shared library /usr/local/lib/php/extensions/no-debug-zts-20240924/zip: No such file or directory), /usr/local/lib/php/extensions/no-debug-zts-20240924/zip.so (Error loading shared library libzip.so.5: No such file or directory (needed by /usr/local/lib/php/extensions/no-debug-zts-20240924/zip.so))) in Unknown on line 0
downloading redis-6.3.0.tgz ...
Starting to download redis-6.3.0.tgz (399,284 bytes)
..........done: 399,284 bytes
43 source files, building
running: phpize
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
Cannot find autoconf. Please check your autoconf installation and the
$PHP_AUTOCONF environment variable. Then, rerun this script.
ERROR: `phpize' failed
The command '/bin/sh -c pecl install redis && docker-php-ext-enable redis' returned a non-zero code: 1
Finished Step #1 - "Build"
ERROR
ERROR: build step 1 "gcr.io/cloud-builders/docker" failed: step exited with non-zero status: 1