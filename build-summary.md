starting build "c045da64-88f7-4f24-b02b-8cf886740e14"
FETCHSOURCE
From https://github.com/arsathmalik0-netizen/G4K
 * branch            ba3604590dc0b7ac384904c2bcf203d9e5738233 -> FETCH_HEAD
HEAD is now at ba36045 ci: align versions and add postgres service and audits
GitCommit:
ba3604590dc0b7ac384904c2bcf203d9e5738233
BUILD
Starting Step #0 - "Build"
Already have image (with digest): gcr.io/cloud-builders/docker
Sending build context to Docker daemon  1.187MB
Step 1/15 : FROM dunglas/frankenphp:php8.4-alpine
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
2667d030b375: Waiting
d2eb499a8bfc: Waiting
b0bd7ce38503: Waiting
4f4fb700ef54: Waiting
b0adb6bf83dd: Download complete
3f3cc2788012: Verifying Checksum
3f3cc2788012: Download complete
4932f93cf9f2: Verifying Checksum
4932f93cf9f2: Download complete
6aafc61cfa24: Verifying Checksum
6aafc61cfa24: Download complete
b51df144faae: Verifying Checksum
b51df144faae: Download complete
23000e62071f: Verifying Checksum
23000e62071f: Download complete
ec3642f48ef9: Verifying Checksum
ec3642f48ef9: Download complete
16b709da63fb: Verifying Checksum
16b709da63fb: Download complete
f536bf4ca218: Verifying Checksum
f536bf4ca218: Download complete
2c3b01f90fe8: Verifying Checksum
2c3b01f90fe8: Download complete
c987dc64560c: Verifying Checksum
c987dc64560c: Download complete
f7e58518052d: Download complete
6aafc61cfa24: Pull complete
9a98e4e8dfe7: Download complete
72ddf142744e: Verifying Checksum
72ddf142744e: Download complete
2667d030b375: Verifying Checksum
2667d030b375: Download complete
4932f93cf9f2: Pull complete
d2eb499a8bfc: Download complete
4f4fb700ef54: Download complete
1ad36136d804: Verifying Checksum
1ad36136d804: Download complete
b0bd7ce38503: Verifying Checksum
b0bd7ce38503: Download complete
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
Step 2/15 : LABEL org.opencontainers.image.title="g4k-api"
Removing intermediate container 85d4b67d29c8
 ---> 2abf56193462
Step 3/15 : COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
latest: Pulling from mlocati/php-extension-installer
ba544c62c795: Pulling fs layer
ba544c62c795: Verifying Checksum
ba544c62c795: Download complete
ba544c62c795: Pull complete
Digest: sha256:b6d3fa381b9ba5cf051117c1c601d6a523b590e534bf3d56eb4fbe352949c138
Status: Downloaded newer image for mlocati/php-extension-installer:latest
 ---> 1716291c6e25
Step 4/15 : COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
2: Pulling from library/composer
55afa1ecc21d: Already exists
faa1b1fb1b65: Already exists
d14903da02a4: Already exists
c5b7eb4d9ab5: Already exists
5f3a7e7d3218: Already exists
c6aa204d885d: Already exists
cc6268776bfa: Already exists
cab6b62ecbc9: Already exists
d6973f72b46a: Already exists
7a29c4a406f0: Pulling fs layer
f74746dc09ae: Pulling fs layer
da9b2c167f7d: Pulling fs layer
849c47f2aa18: Pulling fs layer
9a26646c4e2f: Pulling fs layer
849c47f2aa18: Verifying Checksum
849c47f2aa18: Download complete
9a26646c4e2f: Verifying Checksum
9a26646c4e2f: Download complete
da9b2c167f7d: Verifying Checksum
da9b2c167f7d: Download complete
f74746dc09ae: Verifying Checksum
f74746dc09ae: Download complete
7a29c4a406f0: Verifying Checksum
7a29c4a406f0: Download complete
7a29c4a406f0: Pull complete
f74746dc09ae: Pull complete
da9b2c167f7d: Pull complete
849c47f2aa18: Pull complete
9a26646c4e2f: Pull complete
Digest: sha256:4d71c3c2109c61d5415544264b59ad4087e4c5b7244481723664138fd36d5040
Status: Downloaded newer image for composer:2
 ---> 65ccbab28340
Step 5/15 : RUN install-php-extensions         pdo pdo_pgsql pgsql         gd zip bcmath intl         opcache pcntl posix         redis     && printf "opcache.enable=1\nopcache.memory_consumption=256\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0\nopcache.preload=/var/www/html/preload.php\nopcache.preload_user=root\n"        > /usr/local/etc/php/conf.d/opcache.ini
 ---> Running in bb886993910d
install-php-extensions v.2.11.12
#StandWithUkraine
### WARNING Module already installed: pdo ###
### WARNING Module already installed: opcache ###
### WARNING Module already installed: posix ###
Updating channel "pecl.php.net"
Channel "pecl.php.net" is up to date
v3.24.1-367-gc6f76389c39 [https://dl-cdn.alpinelinux.org/alpine/v3.24/main]
v3.24.1-366-g7497eb54605 [https://dl-cdn.alpinelinux.org/alpine/v3.24/community]
OK: 28641 distinct packages available
### MARKING PRE-INSTALLED PACKAGES AS IN-USE ###
# Packages: libssl3 zstd-libs
OK: 23.2 MiB in 48 packages
### INSTALLING REQUIRED PACKAGES ###
# Packages to be kept after installation: aom-libs libbz2 libpng freetype icu-data-full icu-libs libdav1d libjpeg-turbo libyuv libavif libsharpyuv libwebp libxau libmd libbsd libxdmcp libxcb libx11 libxext libice libuuid libsm libxt libxpm libzip lz4-libs libpq libecpg
# Packages to be used only for installation: aom pkgconf aom-dev m4 perl autoconf libexpat libarchive rhash-libs libuv cmake dav1d-dev dpkg dpkg-dev libmagic file bzip2-dev brotli brotli-dev zlib-dev libpng-dev freetype-dev libstdc++-dev jansson binutils libgcc-static libgomp libatomic gmp isl26 mpfr4 mpc1 gcc musl-dev g++ icu icu-dev libavif-dev libturbojpeg libjpeg-turbo-dev libwebpdecoder libwebpdemux libwebpmux libwebp-dev xorgproto libxau-dev libffi gdbm mpdecimal libpanelw python3 python3-pycache-pyc0 pyc xcb-proto-pyc python3-pyc xcb-proto libxdmcp-dev libxcb-dev xtrans libx11-dev libxpm-dev libzip-tools xz-dev zstd zstd-dev libzip-dev lz4-dev make openssl-dev libpq-dev libecpg-dev liburing-ffi liburing liburing-dev clang22-headers llvm22-libs clang22-libs fortify-headers llvm22-linker-tools clang22 llvm22 postgresql18-dev re2c
(  1/111) Installing aom-libs (3.14.1-r0)
(  2/111) Installing aom (3.14.1-r0)
(  3/111) Installing pkgconf (2.5.1-r0)
(  4/111) Installing aom-dev (3.14.1-r0)
(  5/111) Installing m4 (1.4.20-r1)
(  6/111) Installing libbz2 (1.0.8-r6)
(  7/111) Installing perl (5.42.2-r0)
(  8/111) Installing autoconf (2.73-r0)
(  9/111) Installing jansson (2.15.0-r0)
( 10/111) Installing binutils (2.45.1-r1)
( 11/111) Installing brotli (1.2.0-r1)
( 12/111) Installing brotli-dev (1.2.0-r1)
( 13/111) Installing bzip2-dev (1.0.8-r6)
( 14/111) Installing clang22-headers (22.1.3-r2)
( 15/111) Installing libffi (3.5.2-r1)
( 16/111) Installing llvm22-libs (22.1.3-r0)
( 18/111) Installing fortify-headers (3.0.1-r2)
( 19/111) Installing libgcc-static (15.2.0-r5)
( 20/111) Installing libstdc++-dev (15.2.0-r5)
( 21/111) Installing llvm22-linker-tools (22.1.3-r0)
( 22/111) Installing musl-dev (1.2.6-r2)
( 23/111) Installing clang22 (22.1.3-r2)
( 24/111) Installing libexpat (2.8.2-r0)
( 25/111) Installing lz4-libs (1.10.0-r1)
( 26/111) Installing libarchive (3.8.7-r0)
( 27/111) Installing rhash-libs (1.4.6-r0)
( 28/111) Installing libuv (1.52.1-r0)
( 29/111) Installing cmake (4.2.3-r0)
( 31/111) Installing dav1d-dev (1.5.3-r0)
( 32/111) Installing libmd (1.2.0-r0)
( 33/111) Installing dpkg (1.23.7-r0)
( 34/111) Installing dpkg-dev (1.23.7-r0)
( 35/111) Installing libmagic (5.47-r2)
( 36/111) Installing file (5.47-r2)
( 37/111) Installing libpng (1.6.58-r1)
( 38/111) Installing freetype (2.14.3-r0)
( 39/111) Installing zlib-dev (1.3.2-r0)
( 40/111) Installing libpng-dev (1.6.58-r1)
( 41/111) Installing freetype-dev (2.14.3-r0)
( 42/111) Installing libgomp (15.2.0-r5)
( 43/111) Installing libatomic (15.2.0-r5)
( 44/111) Installing gmp (6.3.0-r4)
( 45/111) Installing isl26 (0.26-r2)
( 46/111) Installing mpfr4 (4.2.2-r0)
( 47/111) Installing mpc1 (1.3.1-r1)
( 48/111) Installing gcc (15.2.0-r5)
( 49/111) Installing g++ (15.2.0-r5)
( 50/111) Installing gdbm (1.26-r0)
( 51/111) Installing icu-data-full (78.1-r0)
( 52/111) Installing icu-libs (78.1-r0)
( 53/111) Installing icu (78.1-r0)
( 54/111) Installing icu-dev (78.1-r0)
( 55/111) Installing libjpeg-turbo (3.1.3-r0)
( 56/111) Installing libyuv (0.0.1928-r0)
( 57/111) Installing libavif (1.4.1-r0)
( 58/111) Installing libavif-dev (1.4.1-r0)
( 59/111) Installing libbsd (0.12.2-r0)
( 60/111) Installing libpq (18.4-r0)
( 61/111) Installing libecpg (18.4-r0)
( 62/111) Installing openssl-dev (3.5.7-r0)
( 63/111) Installing libpq-dev (18.4-r0)
( 64/111) Installing libecpg-dev (18.4-r0)
( 65/111) Installing libice (1.1.2-r0)
( 66/111) Installing libturbojpeg (3.1.3-r0)
( 67/111) Installing libjpeg-turbo-dev (3.1.3-r0)
( 68/111) Installing libpanelw (6.6_p20260516-r0)
( 69/111) Installing libsharpyuv (1.6.0-r0)
( 70/111) Installing libuuid (2.42.1-r0)
( 71/111) Installing libsm (1.2.6-r0)
( 72/111) Installing liburing (2.14-r0)
( 73/111) Installing liburing-ffi (2.14-r0)
( 74/111) Installing liburing-dev (2.14-r0)
( 75/111) Installing libwebp (1.6.0-r0)
( 76/111) Installing libwebpdecoder (1.6.0-r0)
( 77/111) Installing libwebpdemux (1.6.0-r0)
( 78/111) Installing libwebpmux (1.6.0-r0)
( 79/111) Installing libwebp-dev (1.6.0-r0)
( 80/111) Installing libxau (1.0.12-r0)
( 81/111) Installing libxdmcp (1.1.5-r1)
( 82/111) Installing libxcb (1.17.0-r2)
( 83/111) Installing libx11 (1.8.13-r0)
( 84/111) Installing xorgproto (2025.1-r0)
( 85/111) Installing libxau-dev (1.0.12-r0)
( 86/111) Installing mpdecimal (4.0.1-r0)
( 87/111) Installing python3 (3.14.5-r0)
( 88/111) Installing python3-pycache-pyc0 (3.14.5-r0)
( 89/111) Installing pyc (3.14.5-r0)
( 90/111) Installing xcb-proto-pyc (1.17.0-r1)
( 91/111) Installing python3-pyc (3.14.5-r0)
( 92/111) Installing xcb-proto (1.17.0-r1)
( 93/111) Installing libxdmcp-dev (1.1.5-r1)
( 94/111) Installing libxcb-dev (1.17.0-r2)
( 95/111) Installing xtrans (1.6.0-r0)
( 96/111) Installing libx11-dev (1.8.13-r0)
( 97/111) Installing libxext (1.3.7-r0)
( 98/111) Installing libxt (1.3.1-r0)
( 99/111) Installing libxpm (3.5.19-r0)
(100/111) Installing libxpm-dev (3.5.19-r0)
(101/111) Installing libzip (1.11.4-r2)
(102/111) Installing libzip-tools (1.11.4-r2)
(103/111) Installing xz-dev (5.8.3-r0)
(104/111) Installing zstd (1.5.7-r2)
(105/111) Installing zstd-dev (1.5.7-r2)
(106/111) Installing libzip-dev (1.11.4-r2)
(107/111) Installing llvm22 (22.1.3-r0)
(108/111) Installing lz4-dev (1.10.0-r1)
(109/111) Installing make (4.4.1-r4)
(110/111) Installing postgresql18-dev (18.4-r0)
(111/111) Installing re2c (4.5.1-r0)
Executing busybox-1.37.0-r31.trigger
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE pdo_pgsql ###
(1/1) Installing .phpize-deps (20260812.111347)
OK: 921.2 MiB in 160 packages
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
(1/1) Purging .phpize-deps (20260812.111347)
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE pgsql ###
(1/1) Installing .phpize-deps (20260812.111355)
OK: 921.2 MiB in 160 packages
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
(1/1) Purging .phpize-deps (20260812.111355)
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE gd ###
(1/1) Installing .phpize-deps-configure (20260812.111408)
OK: 921.2 MiB in 160 packages
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
checking for libavif... yes
checking for libwebp... yes
checking for libjpeg... yes
checking for libXpm... yes
checking for FreeType 2... yes
checking whether to enable JIS-mapped Japanese font support in GD... no
checking for zlib >= 1.2.11... yes
checking for libpng... yes
checking for libavif >= 0.8.2... yes
checking for libwebp >= 0.2.0... yes
checking for libjpeg... yes
checking for xpm... yes
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
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/gd.c -o gd.lo  -MMD -MF gd.dep -MT gd.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_avif.c -o libgd/gd_avif.lo  -MMD -MF libgd/gd_avif.dep -MT libgd/gd_avif.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/gd.c -MMD -MF gd.dep -MT gd.lo  -fPIC -DPIC -o .libs/gd.o
mkdir libgd/.libs
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_avif.c -MMD -MF libgd/gd_avif.dep -MT libgd/gd_avif.lo  -fPIC -DPIC -o libgd/.libs/gd_avif.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_bmp.c -o libgd/gd_bmp.lo  -MMD -MF libgd/gd_bmp.dep -MT libgd/gd_bmp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_bmp.c -MMD -MF libgd/gd_bmp.dep -MT libgd/gd_bmp.lo  -fPIC -DPIC -o libgd/.libs/gd_bmp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_in.c -o libgd/gd_gif_in.lo  -MMD -MF libgd/gd_gif_in.dep -MT libgd/gd_gif_in.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_in.c -MMD -MF libgd/gd_gif_in.dep -MT libgd/gd_gif_in.lo  -fPIC -DPIC -o libgd/.libs/gd_gif_in.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_out.c -o libgd/gd_gif_out.lo  -MMD -MF libgd/gd_gif_out.dep -MT libgd/gd_gif_out.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_gif_out.c -MMD -MF libgd/gd_gif_out.dep -MT libgd/gd_gif_out.lo  -fPIC -DPIC -o libgd/.libs/gd_gif_out.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_interpolation.c -o libgd/gd_interpolation.lo  -MMD -MF libgd/gd_interpolation.dep -MT libgd/gd_interpolation.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_dp.c -o libgd/gd_io_dp.lo  -MMD -MF libgd/gd_io_dp.dep -MT libgd/gd_io_dp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_interpolation.c -MMD -MF libgd/gd_interpolation.dep -MT libgd/gd_interpolation.lo  -fPIC -DPIC -o libgd/.libs/gd_interpolation.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_dp.c -MMD -MF libgd/gd_io_dp.dep -MT libgd/gd_io_dp.lo  -fPIC -DPIC -o libgd/.libs/gd_io_dp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_file.c -o libgd/gd_io_file.lo  -MMD -MF libgd/gd_io_file.dep -MT libgd/gd_io_file.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_file.c -MMD -MF libgd/gd_io_file.dep -MT libgd/gd_io_file.lo  -fPIC -DPIC -o libgd/.libs/gd_io_file.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_ss.c -o libgd/gd_io_ss.lo  -MMD -MF libgd/gd_io_ss.dep -MT libgd/gd_io_ss.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io_ss.c -MMD -MF libgd/gd_io_ss.dep -MT libgd/gd_io_ss.lo  -fPIC -DPIC -o libgd/.libs/gd_io_ss.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io.c -o libgd/gd_io.lo  -MMD -MF libgd/gd_io.dep -MT libgd/gd_io.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_io.c -MMD -MF libgd/gd_io.dep -MT libgd/gd_io.lo  -fPIC -DPIC -o libgd/.libs/gd_io.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_jpeg.c -o libgd/gd_jpeg.lo  -MMD -MF libgd/gd_jpeg.dep -MT libgd/gd_jpeg.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_jpeg.c -MMD -MF libgd/gd_jpeg.dep -MT libgd/gd_jpeg.lo  -fPIC -DPIC -o libgd/.libs/gd_jpeg.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_matrix.c -o libgd/gd_matrix.lo  -MMD -MF libgd/gd_matrix.dep -MT libgd/gd_matrix.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_matrix.c -MMD -MF libgd/gd_matrix.dep -MT libgd/gd_matrix.lo  -fPIC -DPIC -o libgd/.libs/gd_matrix.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_pixelate.c -o libgd/gd_pixelate.lo  -MMD -MF libgd/gd_pixelate.dep -MT libgd/gd_pixelate.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_pixelate.c -MMD -MF libgd/gd_pixelate.dep -MT libgd/gd_pixelate.lo  -fPIC -DPIC -o libgd/.libs/gd_pixelate.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_png.c -o libgd/gd_png.lo  -MMD -MF libgd/gd_png.dep -MT libgd/gd_png.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_png.c -MMD -MF libgd/gd_png.dep -MT libgd/gd_png.lo  -fPIC -DPIC -o libgd/.libs/gd_png.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_rotate.c -o libgd/gd_rotate.lo  -MMD -MF libgd/gd_rotate.dep -MT libgd/gd_rotate.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_rotate.c -MMD -MF libgd/gd_rotate.dep -MT libgd/gd_rotate.lo  -fPIC -DPIC -o libgd/.libs/gd_rotate.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_security.c -o libgd/gd_security.lo  -MMD -MF libgd/gd_security.dep -MT libgd/gd_security.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_security.c -MMD -MF libgd/gd_security.dep -MT libgd/gd_security.lo  -fPIC -DPIC -o libgd/.libs/gd_security.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_ss.c -o libgd/gd_ss.lo  -MMD -MF libgd/gd_ss.dep -MT libgd/gd_ss.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_ss.c -MMD -MF libgd/gd_ss.dep -MT libgd/gd_ss.lo  -fPIC -DPIC -o libgd/.libs/gd_ss.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_tga.c -o libgd/gd_tga.lo  -MMD -MF libgd/gd_tga.dep -MT libgd/gd_tga.lo
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_topal.c -o libgd/gd_topal.lo  -MMD -MF libgd/gd_topal.dep -MT libgd/gd_topal.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_tga.c -MMD -MF libgd/gd_tga.dep -MT libgd/gd_tga.lo  -fPIC -DPIC -o libgd/.libs/gd_tga.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_topal.c -MMD -MF libgd/gd_topal.dep -MT libgd/gd_topal.lo  -fPIC -DPIC -o libgd/.libs/gd_topal.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_transform.c -o libgd/gd_transform.lo  -MMD -MF libgd/gd_transform.dep -MT libgd/gd_transform.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_transform.c -MMD -MF libgd/gd_transform.dep -MT libgd/gd_transform.lo  -fPIC -DPIC -o libgd/.libs/gd_transform.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_wbmp.c -o libgd/gd_wbmp.lo  -MMD -MF libgd/gd_wbmp.dep -MT libgd/gd_wbmp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_wbmp.c -MMD -MF libgd/gd_wbmp.dep -MT libgd/gd_wbmp.lo  -fPIC -DPIC -o libgd/.libs/gd_wbmp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_webp.c -o libgd/gd_webp.lo  -MMD -MF libgd/gd_webp.dep -MT libgd/gd_webp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_webp.c -MMD -MF libgd/gd_webp.dep -MT libgd/gd_webp.lo  -fPIC -DPIC -o libgd/.libs/gd_webp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_xbm.c -o libgd/gd_xbm.lo  -MMD -MF libgd/gd_xbm.dep -MT libgd/gd_xbm.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd_xbm.c -MMD -MF libgd/gd_xbm.dep -MT libgd/gd_xbm.lo  -fPIC -DPIC -o libgd/.libs/gd_xbm.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd.c -o libgd/gd.lo  -MMD -MF libgd/gd.dep -MT libgd/gd.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gd.c -MMD -MF libgd/gd.dep -MT libgd/gd.lo  -fPIC -DPIC -o libgd/.libs/gd.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdcache.c -o libgd/gdcache.lo  -MMD -MF libgd/gdcache.dep -MT libgd/gdcache.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdcache.c -MMD -MF libgd/gdcache.dep -MT libgd/gdcache.lo  -fPIC -DPIC -o libgd/.libs/gdcache.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontg.c -o libgd/gdfontg.lo  -MMD -MF libgd/gdfontg.dep -MT libgd/gdfontg.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontg.c -MMD -MF libgd/gdfontg.dep -MT libgd/gdfontg.lo  -fPIC -DPIC -o libgd/.libs/gdfontg.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontl.c -o libgd/gdfontl.lo  -MMD -MF libgd/gdfontl.dep -MT libgd/gdfontl.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontl.c -MMD -MF libgd/gdfontl.dep -MT libgd/gdfontl.lo  -fPIC -DPIC -o libgd/.libs/gdfontl.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontmb.c -o libgd/gdfontmb.lo  -MMD -MF libgd/gdfontmb.dep -MT libgd/gdfontmb.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontmb.c -MMD -MF libgd/gdfontmb.dep -MT libgd/gdfontmb.lo  -fPIC -DPIC -o libgd/.libs/gdfontmb.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfonts.c -o libgd/gdfonts.lo  -MMD -MF libgd/gdfonts.dep -MT libgd/gdfonts.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfonts.c -MMD -MF libgd/gdfonts.dep -MT libgd/gdfonts.lo  -fPIC -DPIC -o libgd/.libs/gdfonts.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontt.c -o libgd/gdfontt.lo  -MMD -MF libgd/gdfontt.dep -MT libgd/gdfontt.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdfontt.c -MMD -MF libgd/gdfontt.dep -MT libgd/gdfontt.lo  -fPIC -DPIC -o libgd/.libs/gdfontt.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdft.c -o libgd/gdft.lo  -MMD -MF libgd/gdft.dep -MT libgd/gdft.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdft.c -MMD -MF libgd/gdft.dep -MT libgd/gdft.lo  -fPIC -DPIC -o libgd/.libs/gdft.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdhelpers.c -o libgd/gdhelpers.lo  -MMD -MF libgd/gdhelpers.dep -MT libgd/gdhelpers.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdhelpers.c -MMD -MF libgd/gdhelpers.dep -MT libgd/gdhelpers.lo  -fPIC -DPIC -o libgd/.libs/gdhelpers.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdkanji.c -o libgd/gdkanji.lo  -MMD -MF libgd/gdkanji.dep -MT libgd/gdkanji.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdkanji.c -MMD -MF libgd/gdkanji.dep -MT libgd/gdkanji.lo  -fPIC -DPIC -o libgd/.libs/gdkanji.o
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdtables.c -MMD -MF libgd/gdtables.dep -MT libgd/gdtables.lo  -fPIC -DPIC -o libgd/.libs/gdtables.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdxpm.c -o libgd/gdxpm.lo  -MMD -MF libgd/gdxpm.dep -MT libgd/gdxpm.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/gdxpm.c -MMD -MF libgd/gdxpm.dep -MT libgd/gdxpm.lo  -fPIC -DPIC -o libgd/.libs/gdxpm.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/wbmp.c -o libgd/wbmp.lo  -MMD -MF libgd/wbmp.dep -MT libgd/wbmp.lo
 cc -I. -I/usr/src/php/ext/gd -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2 -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -Wno-strict-prototypes -I/usr/src/php/ext/gd/libgd -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/gd/libgd/wbmp.c -MMD -MF libgd/wbmp.dep -MT libgd/wbmp.lo  -fPIC -DPIC -o libgd/.libs/wbmp.o
/bin/sh /usr/src/php/ext/gd/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/include/libpng16 -I/usr/include/webp -I/usr/include/freetype2  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o gd.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/gd/modules  gd.lo libgd/gd_avif.lo libgd/gd_bmp.lo libgd/gd_color_match.lo libgd/gd_crop.lo libgd/gd_filter.lo libgd/gd_gd.lo libgd/gd_gd2.lo libgd/gd_gif_in.lo libgd/gd_gif_out.lo libgd/gd_interpolation.lo libgd/gd_io_dp.lo libgd/gd_io_file.lo libgd/gd_io_ss.lo libgd/gd_io.lo libgd/gd_jpeg.lo libgd/gd_matrix.lo libgd/gd_pixelate.lo libgd/gd_png.lo libgd/gd_rotate.lo libgd/gd_security.lo libgd/gd_ss.lo libgd/gd_tga.lo libgd/gd_topal.lo libgd/gd_transform.lo libgd/gd_wbmp.lo libgd/gd_webp.lo libgd/gd_xbm.lo libgd/gd.lo libgd/gdcache.lo libgd/gdfontg.lo libgd/gdfontl.lo libgd/gdfontmb.lo libgd/gdfonts.lo libgd/gdfontt.lo libgd/gdft.lo libgd/gdhelpers.lo libgd/gdkanji.lo libgd/gdtables.lo libgd/gdxpm.lo libgd/wbmp.lo -lz -lpng16 -lavif -lwebp -ljpeg -lXpm -lX11 -lfreetype
cc -shared  .libs/gd.o libgd/.libs/gd_avif.o libgd/.libs/gd_bmp.o libgd/.libs/gd_color_match.o libgd/.libs/gd_crop.o libgd/.libs/gd_filter.o libgd/.libs/gd_gd.o libgd/.libs/gd_gd2.o libgd/.libs/gd_gif_in.o libgd/.libs/gd_gif_out.o libgd/.libs/gd_interpolation.o libgd/.libs/gd_io_dp.o libgd/.libs/gd_io_file.o libgd/.libs/gd_io_ss.o libgd/.libs/gd_io.o libgd/.libs/gd_jpeg.o libgd/.libs/gd_matrix.o libgd/.libs/gd_pixelate.o libgd/.libs/gd_png.o libgd/.libs/gd_rotate.o libgd/.libs/gd_security.o libgd/.libs/gd_ss.o libgd/.libs/gd_tga.o libgd/.libs/gd_topal.o libgd/.libs/gd_transform.o libgd/.libs/gd_wbmp.o libgd/.libs/gd_webp.o libgd/.libs/gd_xbm.o libgd/.libs/gd.o libgd/.libs/gdcache.o libgd/.libs/gdfontg.o libgd/.libs/gdfontl.o libgd/.libs/gdfontmb.o libgd/.libs/gdfonts.o libgd/.libs/gdfontt.o libgd/.libs/gdft.o libgd/.libs/gdhelpers.o libgd/.libs/gdkanji.o libgd/.libs/gdtables.o libgd/.libs/gdxpm.o libgd/.libs/wbmp.o  -lz -lpng16 -lavif -lwebp -ljpeg -lXpm -lX11 -lfreetype  -Wl,-O1 -Wl,-soname -Wl,gd.so -o .libs/gd.so
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
(1/1) Purging .phpize-deps-configure (20260812.111408)
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE zip ###
(1/1) Installing .phpize-deps-configure (20260812.111434)
OK: 921.2 MiB in 160 packages
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
 cc -I. -I/usr/src/php/ext/zip -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/zip/php_zip.c -MMD -MF php_zip.dep -MT php_zip.lo  -fPIC -DPIC -o .libs/php_zip.o
 cc -I. -I/usr/src/php/ext/zip -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/zip/zip_stream.c -MMD -MF zip_stream.dep -MT zip_stream.lo  -fPIC -DPIC -o .libs/zip_stream.o
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
(1/1) Purging .phpize-deps-configure (20260812.111434)
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE bcmath ###
(1/1) Installing .phpize-deps (20260812.111444)
OK: 921.2 MiB in 160 packages
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
mkdir .libs
mkdir libbcmath/src/.libs
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/bcmath.c -MMD -MF bcmath.dep -MT bcmath.lo  -fPIC -DPIC -o .libs/bcmath.o
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/add.c -MMD -MF libbcmath/src/add.dep -MT libbcmath/src/add.lo  -fPIC -DPIC -o libbcmath/src/.libs/add.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/compare.c -o libbcmath/src/compare.lo  -MMD -MF libbcmath/src/compare.dep -MT libbcmath/src/compare.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/compare.c -MMD -MF libbcmath/src/compare.dep -MT libbcmath/src/compare.lo  -fPIC -DPIC -o libbcmath/src/.libs/compare.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/convert.c -o libbcmath/src/convert.lo  -MMD -MF libbcmath/src/convert.dep -MT libbcmath/src/convert.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/convert.c -MMD -MF libbcmath/src/convert.dep -MT libbcmath/src/convert.lo  -fPIC -DPIC -o libbcmath/src/.libs/convert.o
/bin/sh /usr/src/php/ext/bcmath/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE   -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/div.c -o libbcmath/src/div.lo  -MMD -MF libbcmath/src/div.dep -MT libbcmath/src/div.lo
 cc -I. -I/usr/src/php/ext/bcmath -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/bcmath/libbcmath/src/div.c -MMD -MF libbcmath/src/div.dep -MT libbcmath/src/div.lo  -fPIC -DPIC -o libbcmath/src/.libs/div.o
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
(1/1) Purging .phpize-deps (20260812.111444)
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE intl ###
(1/1) Installing .phpize-deps (20260812.111457)
OK: 921.2 MiB in 160 packages
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
checking whether to enable internationalization support... yes, shared
checking for icu-uc >= 50.1 icu-io icu-i18n... yes
checking for g++... g++
checking whether the compiler supports GNU C++... yes
checking whether g++ accepts -g... yes
checking how to run the C++ preprocessor... g++ -E
checking if intl requires -std=gnu++17... yes
checking whether g++ supports C++17 features with -std=c++17... yes
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
checking how to run the C++ preprocessor... g++ -E
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
checking for ld used by g++... /usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64
checking if the linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) is GNU ld... yes
checking whether the g++ linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking for g++ option to produce PIC... -fPIC
checking if g++ PIC flag -fPIC works... yes
checking if g++ static flag -static works... yes
checking if g++ supports -c -o file.o... yes
checking whether the g++ linker (/usr/x86_64-alpine-linux-musl/bin/ld -m elf_x86_64) supports shared libraries... yes
checking dynamic linker characteristics... GNU/Linux ld.so
(cached) (cached) checking how to hardcode library paths into programs... immediate
Generating files
configure: creating build directories
configure: creating Makefile
configure: patching config.h.in
configure: creating ./config.status
config.status: creating config.h
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_attr.c -o collator/collator_attr.lo  -MMD -MF collator/collator_attr.dep -MT collator/collator_attr.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_class.c -o collator/collator_class.lo  -MMD -MF collator/collator_class.dep -MT collator/collator_class.lo
mkdir collator/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_attr.c -MMD -MF collator/collator_attr.dep -MT collator/collator_attr.lo  -fPIC -DPIC -o collator/.libs/collator_attr.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_class.c -MMD -MF collator/collator_class.dep -MT collator/collator_class.lo  -fPIC -DPIC -o collator/.libs/collator_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_compare.c -o collator/collator_compare.lo  -MMD -MF collator/collator_compare.dep -MT collator/collator_compare.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_compare.c -MMD -MF collator/collator_compare.dep -MT collator/collator_compare.lo  -fPIC -DPIC -o collator/.libs/collator_compare.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_convert.c -o collator/collator_convert.lo  -MMD -MF collator/collator_convert.dep -MT collator/collator_convert.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_convert.c -MMD -MF collator/collator_convert.dep -MT collator/collator_convert.lo  -fPIC -DPIC -o collator/.libs/collator_convert.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_create.c -o collator/collator_create.lo  -MMD -MF collator/collator_create.dep -MT collator/collator_create.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_create.c -MMD -MF collator/collator_create.dep -MT collator/collator_create.lo  -fPIC -DPIC -o collator/.libs/collator_create.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_error.c -o collator/collator_error.lo  -MMD -MF collator/collator_error.dep -MT collator/collator_error.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_error.c -MMD -MF collator/collator_error.dep -MT collator/collator_error.lo  -fPIC -DPIC -o collator/.libs/collator_error.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_is_numeric.c -o collator/collator_is_numeric.lo  -MMD -MF collator/collator_is_numeric.dep -MT collator/collator_is_numeric.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_is_numeric.c -MMD -MF collator/collator_is_numeric.dep -MT collator/collator_is_numeric.lo  -fPIC -DPIC -o collator/.libs/collator_is_numeric.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_locale.c -o collator/collator_locale.lo  -MMD -MF collator/collator_locale.dep -MT collator/collator_locale.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_locale.c -MMD -MF collator/collator_locale.dep -MT collator/collator_locale.lo  -fPIC -DPIC -o collator/.libs/collator_locale.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_sort.c -o collator/collator_sort.lo  -MMD -MF collator/collator_sort.dep -MT collator/collator_sort.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/collator/collator_sort.c -MMD -MF collator/collator_sort.dep -MT collator/collator_sort.lo  -fPIC -DPIC -o collator/.libs/collator_sort.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/common/common_error.c -o common/common_error.lo  -MMD -MF common/common_error.dep -MT common/common_error.lo
mkdir common/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/common/common_error.c -MMD -MF common/common_error.dep -MT common/common_error.lo  -fPIC -DPIC -o common/.libs/common_error.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/converter/converter.c -o converter/converter.lo  -MMD -MF converter/converter.dep -MT converter/converter.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_attr.c -o dateformat/dateformat_attr.lo  -MMD -MF dateformat/dateformat_attr.dep -MT dateformat/dateformat_attr.lo
mkdir converter/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/converter/converter.c -MMD -MF converter/converter.dep -MT converter/converter.lo  -fPIC -DPIC -o converter/.libs/converter.o
mkdir dateformat/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_attr.c -MMD -MF dateformat/dateformat_attr.dep -MT dateformat/dateformat_attr.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_attr.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_class.c -MMD -MF dateformat/dateformat_class.dep -MT dateformat/dateformat_class.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_data.c -o dateformat/dateformat_data.lo  -MMD -MF dateformat/dateformat_data.dep -MT dateformat/dateformat_data.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_data.c -MMD -MF dateformat/dateformat_data.dep -MT dateformat/dateformat_data.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_data.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_format.c -o dateformat/dateformat_format.lo  -MMD -MF dateformat/dateformat_format.dep -MT dateformat/dateformat_format.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_format.c -MMD -MF dateformat/dateformat_format.dep -MT dateformat/dateformat_format.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_format.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_parse.c -o dateformat/dateformat_parse.lo  -MMD -MF dateformat/dateformat_parse.dep -MT dateformat/dateformat_parse.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat.c -o dateformat/dateformat.lo  -MMD -MF dateformat/dateformat.dep -MT dateformat/dateformat.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat_parse.c -MMD -MF dateformat/dateformat_parse.dep -MT dateformat/dateformat_parse.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_parse.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/dateformat/dateformat.c -MMD -MF dateformat/dateformat.dep -MT dateformat/dateformat.lo  -fPIC -DPIC -o dateformat/.libs/dateformat.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_data.c -o formatter/formatter_data.lo  -MMD -MF formatter/formatter_data.dep -MT formatter/formatter_data.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_data.c -MMD -MF formatter/formatter_data.dep -MT formatter/formatter_data.lo  -fPIC -DPIC -o formatter/.libs/formatter_data.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_format.c -o formatter/formatter_format.lo  -MMD -MF formatter/formatter_format.dep -MT formatter/formatter_format.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_format.c -MMD -MF formatter/formatter_format.dep -MT formatter/formatter_format.lo  -fPIC -DPIC -o formatter/.libs/formatter_format.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_main.c -o formatter/formatter_main.lo  -MMD -MF formatter/formatter_main.dep -MT formatter/formatter_main.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_main.c -MMD -MF formatter/formatter_main.dep -MT formatter/formatter_main.lo  -fPIC -DPIC -o formatter/.libs/formatter_main.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_parse.c -o formatter/formatter_parse.lo  -MMD -MF formatter/formatter_parse.dep -MT formatter/formatter_parse.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/formatter/formatter_parse.c -MMD -MF formatter/formatter_parse.dep -MT formatter/formatter_parse.lo  -fPIC -DPIC -o formatter/.libs/formatter_parse.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/grapheme/grapheme_string.c -o grapheme/grapheme_string.lo  -MMD -MF grapheme/grapheme_string.dep -MT grapheme/grapheme_string.lo
mkdir grapheme/.libs
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/grapheme/grapheme_util.c -o grapheme/grapheme_util.lo  -MMD -MF grapheme/grapheme_util.dep -MT grapheme/grapheme_util.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/grapheme/grapheme_string.c -MMD -MF grapheme/grapheme_string.dep -MT grapheme/grapheme_string.lo  -fPIC -DPIC -o grapheme/.libs/grapheme_string.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/grapheme/grapheme_util.c -MMD -MF grapheme/grapheme_util.dep -MT grapheme/grapheme_util.lo  -fPIC -DPIC -o grapheme/.libs/grapheme_util.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/idn/idn.c -o idn/idn.lo  -MMD -MF idn/idn.dep -MT idn/idn.lo
mkdir idn/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/idn/idn.c -MMD -MF idn/idn.dep -MT idn/idn.lo  -fPIC -DPIC -o idn/.libs/idn.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/intl_convert.c -o intl_convert.lo  -MMD -MF intl_convert.dep -MT intl_convert.lo
mkdir .libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/intl_convert.c -MMD -MF intl_convert.dep -MT intl_convert.lo  -fPIC -DPIC -o .libs/intl_convert.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/intl_error.c -o intl_error.lo  -MMD -MF intl_error.dep -MT intl_error.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/intl_error.c -MMD -MF intl_error.dep -MT intl_error.lo  -fPIC -DPIC -o .libs/intl_error.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/locale/locale_class.c -o locale/locale_class.lo  -MMD -MF locale/locale_class.dep -MT locale/locale_class.lo
mkdir locale/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/locale/locale_class.c -MMD -MF locale/locale_class.dep -MT locale/locale_class.lo  -fPIC -DPIC -o locale/.libs/locale_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/locale/locale_methods.c -o locale/locale_methods.lo  -MMD -MF locale/locale_methods.dep -MT locale/locale_methods.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/locale/locale_methods.c -MMD -MF locale/locale_methods.dep -MT locale/locale_methods.lo  -fPIC -DPIC -o locale/.libs/locale_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/locale/locale.c -o locale/locale.lo  -MMD -MF locale/locale.dep -MT locale/locale.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/locale/locale.c -MMD -MF locale/locale.dep -MT locale/locale.lo  -fPIC -DPIC -o locale/.libs/locale.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_attr.c -o msgformat/msgformat_attr.lo  -MMD -MF msgformat/msgformat_attr.dep -MT msgformat/msgformat_attr.lo
mkdir msgformat/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_attr.c -MMD -MF msgformat/msgformat_attr.dep -MT msgformat/msgformat_attr.lo  -fPIC -DPIC -o msgformat/.libs/msgformat_attr.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_class.c -o msgformat/msgformat_class.lo  -MMD -MF msgformat/msgformat_class.dep -MT msgformat/msgformat_class.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_class.c -MMD -MF msgformat/msgformat_class.dep -MT msgformat/msgformat_class.lo  -fPIC -DPIC -o msgformat/.libs/msgformat_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_data.c -o msgformat/msgformat_data.lo  -MMD -MF msgformat/msgformat_data.dep -MT msgformat/msgformat_data.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_data.c -MMD -MF msgformat/msgformat_data.dep -MT msgformat/msgformat_data.lo  -fPIC -DPIC -o msgformat/.libs/msgformat_data.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_format.c -o msgformat/msgformat_format.lo  -MMD -MF msgformat/msgformat_format.dep -MT msgformat/msgformat_format.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_format.c -MMD -MF msgformat/msgformat_format.dep -MT msgformat/msgformat_format.lo  -fPIC -DPIC -o msgformat/.libs/msgformat_format.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_parse.c -o msgformat/msgformat_parse.lo  -MMD -MF msgformat/msgformat_parse.dep -MT msgformat/msgformat_parse.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat.c -o msgformat/msgformat.lo  -MMD -MF msgformat/msgformat.dep -MT msgformat/msgformat.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat_parse.c -MMD -MF msgformat/msgformat_parse.dep -MT msgformat/msgformat_parse.lo  -fPIC -DPIC -o msgformat/.libs/msgformat_parse.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/msgformat/msgformat.c -MMD -MF msgformat/msgformat.dep -MT msgformat/msgformat.lo  -fPIC -DPIC -o msgformat/.libs/msgformat.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/normalizer/normalizer_class.c -o normalizer/normalizer_class.lo  -MMD -MF normalizer/normalizer_class.dep -MT normalizer/normalizer_class.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/normalizer/normalizer_normalize.c -o normalizer/normalizer_normalize.lo  -MMD -MF normalizer/normalizer_normalize.dep -MT normalizer/normalizer_normalize.lo
mkdir normalizer/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/normalizer/normalizer_class.c -MMD -MF normalizer/normalizer_class.dep -MT normalizer/normalizer_class.lo  -fPIC -DPIC -o normalizer/.libs/normalizer_class.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/normalizer/normalizer_normalize.c -MMD -MF normalizer/normalizer_normalize.dep -MT normalizer/normalizer_normalize.lo  -fPIC -DPIC -o normalizer/.libs/normalizer_normalize.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/php_intl.c -o php_intl.lo  -MMD -MF php_intl.dep -MT php_intl.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/php_intl.c -MMD -MF php_intl.dep -MT php_intl.lo  -fPIC -DPIC -o .libs/php_intl.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/resourcebundle/resourcebundle_class.c -o resourcebundle/resourcebundle_class.lo  -MMD -MF resourcebundle/resourcebundle_class.dep -MT resourcebundle/resourcebundle_class.lo
mkdir resourcebundle/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/resourcebundle/resourcebundle_class.c -MMD -MF resourcebundle/resourcebundle_class.dep -MT resourcebundle/resourcebundle_class.lo  -fPIC -DPIC -o resourcebundle/.libs/resourcebundle_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/resourcebundle/resourcebundle_iterator.c -o resourcebundle/resourcebundle_iterator.lo  -MMD -MF resourcebundle/resourcebundle_iterator.dep -MT resourcebundle/resourcebundle_iterator.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/resourcebundle/resourcebundle.c -o resourcebundle/resourcebundle.lo  -MMD -MF resourcebundle/resourcebundle.dep -MT resourcebundle/resourcebundle.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/resourcebundle/resourcebundle_iterator.c -MMD -MF resourcebundle/resourcebundle_iterator.dep -MT resourcebundle/resourcebundle_iterator.lo  -fPIC -DPIC -o resourcebundle/.libs/resourcebundle_iterator.o
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/resourcebundle/resourcebundle.c -MMD -MF resourcebundle/resourcebundle.dep -MT resourcebundle/resourcebundle.lo  -fPIC -DPIC -o resourcebundle/.libs/resourcebundle.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/spoofchecker/spoofchecker_main.c -o spoofchecker/spoofchecker_main.lo  -MMD -MF spoofchecker/spoofchecker_main.dep -MT spoofchecker/spoofchecker_main.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/spoofchecker/spoofchecker_main.c -MMD -MF spoofchecker/spoofchecker_main.dep -MT spoofchecker/spoofchecker_main.lo  -fPIC -DPIC -o spoofchecker/.libs/spoofchecker_main.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/transliterator/transliterator_class.c -o transliterator/transliterator_class.lo  -MMD -MF transliterator/transliterator_class.dep -MT transliterator/transliterator_class.lo
mkdir transliterator/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/transliterator/transliterator_class.c -MMD -MF transliterator/transliterator_class.dep -MT transliterator/transliterator_class.lo  -fPIC -DPIC -o transliterator/.libs/transliterator_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/transliterator/transliterator_methods.c -o transliterator/transliterator_methods.lo  -MMD -MF transliterator/transliterator_methods.dep -MT transliterator/transliterator_methods.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CC --mode=compile cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/uchar/uchar.c -o uchar/uchar.lo  -MMD -MF uchar/uchar.dep -MT uchar/uchar.lo
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/transliterator/transliterator_methods.c -MMD -MF transliterator/transliterator_methods.dep -MT transliterator/transliterator_methods.lo  -fPIC -DPIC -o transliterator/.libs/transliterator_methods.o
mkdir uchar/.libs
 cc -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -DZEND_COMPILE_DL_EXT=1 -c /usr/src/php/ext/intl/uchar/uchar.c -MMD -MF uchar/uchar.dep -MT uchar/uchar.lo  -fPIC -DPIC -o uchar/.libs/uchar.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/intl_convertcpp.cpp -o intl_convertcpp.lo  -MMD -MF intl_convertcpp.dep -MT intl_convertcpp.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/intl_convertcpp.cpp -MMD -MF intl_convertcpp.dep -MT intl_convertcpp.lo  -fPIC -DPIC -o .libs/intl_convertcpp.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/common/common_enum.cpp -o common/common_enum.lo  -MMD -MF common/common_enum.dep -MT common/common_enum.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/common/common_enum.cpp -MMD -MF common/common_enum.dep -MT common/common_enum.lo  -fPIC -DPIC -o common/.libs/common_enum.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/common/common_date.cpp -o common/common_date.lo  -MMD -MF common/common_date.dep -MT common/common_date.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/common/common_date.cpp -MMD -MF common/common_date.dep -MT common/common_date.lo  -fPIC -DPIC -o common/.libs/common_date.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_format_object.cpp -o dateformat/dateformat_format_object.lo  -MMD -MF dateformat/dateformat_format_object.dep -MT dateformat/dateformat_format_object.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_format_object.cpp -MMD -MF dateformat/dateformat_format_object.dep -MT dateformat/dateformat_format_object.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_format_object.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_create.cpp -o dateformat/dateformat_create.lo  -MMD -MF dateformat/dateformat_create.dep -MT dateformat/dateformat_create.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_create.cpp -MMD -MF dateformat/dateformat_create.dep -MT dateformat/dateformat_create.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_create.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_attrcpp.cpp -o dateformat/dateformat_attrcpp.lo  -MMD -MF dateformat/dateformat_attrcpp.dep -MT dateformat/dateformat_attrcpp.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_attrcpp.cpp -MMD -MF dateformat/dateformat_attrcpp.dep -MT dateformat/dateformat_attrcpp.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_attrcpp.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_helpers.cpp -o dateformat/dateformat_helpers.lo  -MMD -MF dateformat/dateformat_helpers.dep -MT dateformat/dateformat_helpers.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/dateformat_helpers.cpp -MMD -MF dateformat/dateformat_helpers.dep -MT dateformat/dateformat_helpers.lo  -fPIC -DPIC -o dateformat/.libs/dateformat_helpers.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/datepatterngenerator_class.cpp -o dateformat/datepatterngenerator_class.lo  -MMD -MF dateformat/datepatterngenerator_class.dep -MT dateformat/datepatterngenerator_class.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/datepatterngenerator_class.cpp -MMD -MF dateformat/datepatterngenerator_class.dep -MT dateformat/datepatterngenerator_class.lo  -fPIC -DPIC -o dateformat/.libs/datepatterngenerator_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/datepatterngenerator_methods.cpp -o dateformat/datepatterngenerator_methods.lo  -MMD -MF dateformat/datepatterngenerator_methods.dep -MT dateformat/datepatterngenerator_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/dateformat/datepatterngenerator_methods.cpp -MMD -MF dateformat/datepatterngenerator_methods.dep -MT dateformat/datepatterngenerator_methods.lo  -fPIC -DPIC -o dateformat/.libs/datepatterngenerator_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/msgformat/msgformat_helpers.cpp -o msgformat/msgformat_helpers.lo  -MMD -MF msgformat/msgformat_helpers.dep -MT msgformat/msgformat_helpers.lo
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/timezone/timezone_class.cpp -o timezone/timezone_class.lo  -MMD -MF timezone/timezone_class.dep -MT timezone/timezone_class.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/msgformat/msgformat_helpers.cpp -MMD -MF msgformat/msgformat_helpers.dep -MT msgformat/msgformat_helpers.lo  -fPIC -DPIC -o msgformat/.libs/msgformat_helpers.o
mkdir timezone/.libs
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/timezone/timezone_class.cpp -MMD -MF timezone/timezone_class.dep -MT timezone/timezone_class.lo  -fPIC -DPIC -o timezone/.libs/timezone_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/timezone/timezone_methods.cpp -o timezone/timezone_methods.lo  -MMD -MF timezone/timezone_methods.dep -MT timezone/timezone_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/timezone/timezone_methods.cpp -MMD -MF timezone/timezone_methods.dep -MT timezone/timezone_methods.lo  -fPIC -DPIC -o timezone/.libs/timezone_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/calendar/calendar_class.cpp -o calendar/calendar_class.lo  -MMD -MF calendar/calendar_class.dep -MT calendar/calendar_class.lo
mkdir calendar/.libs
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/calendar/calendar_class.cpp -MMD -MF calendar/calendar_class.dep -MT calendar/calendar_class.lo  -fPIC -DPIC -o calendar/.libs/calendar_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/calendar/calendar_methods.cpp -o calendar/calendar_methods.lo  -MMD -MF calendar/calendar_methods.dep -MT calendar/calendar_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/calendar/calendar_methods.cpp -MMD -MF calendar/calendar_methods.dep -MT calendar/calendar_methods.lo  -fPIC -DPIC -o calendar/.libs/calendar_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/calendar/gregoriancalendar_methods.cpp -o calendar/gregoriancalendar_methods.lo  -MMD -MF calendar/gregoriancalendar_methods.dep -MT calendar/gregoriancalendar_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/calendar/gregoriancalendar_methods.cpp -MMD -MF calendar/gregoriancalendar_methods.dep -MT calendar/gregoriancalendar_methods.lo  -fPIC -DPIC -o calendar/.libs/gregoriancalendar_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/breakiterator_class.cpp -o breakiterator/breakiterator_class.lo  -MMD -MF breakiterator/breakiterator_class.dep -MT breakiterator/breakiterator_class.lo
mkdir breakiterator/.libs
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/breakiterator_class.cpp -MMD -MF breakiterator/breakiterator_class.dep -MT breakiterator/breakiterator_class.lo  -fPIC -DPIC -o breakiterator/.libs/breakiterator_class.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/breakiterator_iterators.cpp -o breakiterator/breakiterator_iterators.lo  -MMD -MF breakiterator/breakiterator_iterators.dep -MT breakiterator/breakiterator_iterators.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/breakiterator_iterators.cpp -MMD -MF breakiterator/breakiterator_iterators.dep -MT breakiterator/breakiterator_iterators.lo  -fPIC -DPIC -o breakiterator/.libs/breakiterator_iterators.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/breakiterator_methods.cpp -o breakiterator/breakiterator_methods.lo  -MMD -MF breakiterator/breakiterator_methods.dep -MT breakiterator/breakiterator_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/breakiterator_methods.cpp -MMD -MF breakiterator/breakiterator_methods.dep -MT breakiterator/breakiterator_methods.lo  -fPIC -DPIC -o breakiterator/.libs/breakiterator_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/rulebasedbreakiterator_methods.cpp -o breakiterator/rulebasedbreakiterator_methods.lo  -MMD -MF breakiterator/rulebasedbreakiterator_methods.dep -MT breakiterator/rulebasedbreakiterator_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/rulebasedbreakiterator_methods.cpp -MMD -MF breakiterator/rulebasedbreakiterator_methods.dep -MT breakiterator/rulebasedbreakiterator_methods.lo  -fPIC -DPIC -o breakiterator/.libs/rulebasedbreakiterator_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/codepointiterator_internal.cpp -o breakiterator/codepointiterator_internal.lo  -MMD -MF breakiterator/codepointiterator_internal.dep -MT breakiterator/codepointiterator_internal.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/codepointiterator_internal.cpp -MMD -MF breakiterator/codepointiterator_internal.dep -MT breakiterator/codepointiterator_internal.lo  -fPIC -DPIC -o breakiterator/.libs/codepointiterator_internal.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=compile g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -g -O2    -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17  -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/codepointiterator_methods.cpp -o breakiterator/codepointiterator_methods.lo  -MMD -MF breakiterator/codepointiterator_methods.dep -MT breakiterator/codepointiterator_methods.lo
 g++ -I. -I/usr/src/php/ext/intl -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H -g -O2 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DU_HIDE_OBSOLETE_UTF_OLD_H=1 -Wno-write-strings -D__STDC_LIMIT_MACROS -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 -std=c++17 -DUNISTR_FROM_CHAR_EXPLICIT=explicit -DUNISTR_FROM_STRING_EXPLICIT=explicit -c /usr/src/php/ext/intl/breakiterator/codepointiterator_methods.cpp -MMD -MF breakiterator/codepointiterator_methods.dep -MT breakiterator/codepointiterator_methods.lo  -fPIC -DPIC -o breakiterator/.libs/codepointiterator_methods.o
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=link g++ -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -DHAVE_CONFIG_H  -fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE  -Wl,-O1 -pie  -o intl.la -export-dynamic -avoid-version -prefer-pic -module -rpath /usr/src/php/ext/intl/modules  collator/collator_attr.lo collator/collator_class.lo collator/collator_compare.lo collator/collator_convert.lo collator/collator_create.lo collator/collator_error.lo collator/collator_is_numeric.lo collator/collator_locale.lo collator/collator_sort.lo common/common_error.lo converter/converter.lo dateformat/dateformat_attr.lo dateformat/dateformat_class.lo dateformat/dateformat_data.lo dateformat/dateformat_format.lo dateformat/dateformat_parse.lo dateformat/dateformat.lo formatter/formatter_attr.lo formatter/formatter_class.lo formatter/formatter_data.lo formatter/formatter_format.lo formatter/formatter_main.lo formatter/formatter_parse.lo grapheme/grapheme_string.lo grapheme/grapheme_util.lo idn/idn.lo intl_convert.lo intl_error.lo locale/locale_class.lo locale/locale_methods.lo locale/locale.lo msgformat/msgformat_attr.lo msgformat/msgformat_class.lo msgformat/msgformat_data.lo msgformat/msgformat_format.lo msgformat/msgformat_parse.lo msgformat/msgformat.lo normalizer/normalizer_class.lo normalizer/normalizer_normalize.lo php_intl.lo resourcebundle/resourcebundle_class.lo resourcebundle/resourcebundle_iterator.lo resourcebundle/resourcebundle.lo spoofchecker/spoofchecker_class.lo spoofchecker/spoofchecker_create.lo spoofchecker/spoofchecker_main.lo transliterator/transliterator_class.lo transliterator/transliterator_methods.lo uchar/uchar.lo intl_convertcpp.lo common/common_enum.lo common/common_date.lo dateformat/dateformat_format_object.lo dateformat/dateformat_create.lo dateformat/dateformat_attrcpp.lo dateformat/dateformat_helpers.lo dateformat/datepatterngenerator_class.lo dateformat/datepatterngenerator_methods.lo msgformat/msgformat_helpers.lo timezone/timezone_class.lo timezone/timezone_methods.lo calendar/calendar_class.lo calendar/calendar_methods.lo calendar/gregoriancalendar_methods.lo breakiterator/breakiterator_class.lo breakiterator/breakiterator_iterators.lo breakiterator/breakiterator_methods.lo breakiterator/rulebasedbreakiterator_methods.lo breakiterator/codepointiterator_internal.lo breakiterator/codepointiterator_methods.lo -licuio -licui18n -licuuc
g++ -shared -nostdlib /usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/../../../../lib/crti.o /usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/crtbeginS.o  collator/.libs/collator_attr.o collator/.libs/collator_class.o collator/.libs/collator_compare.o collator/.libs/collator_convert.o collator/.libs/collator_create.o collator/.libs/collator_error.o collator/.libs/collator_is_numeric.o collator/.libs/collator_locale.o collator/.libs/collator_sort.o common/.libs/common_error.o converter/.libs/converter.o dateformat/.libs/dateformat_attr.o dateformat/.libs/dateformat_class.o dateformat/.libs/dateformat_data.o dateformat/.libs/dateformat_format.o dateformat/.libs/dateformat_parse.o dateformat/.libs/dateformat.o formatter/.libs/formatter_attr.o formatter/.libs/formatter_class.o formatter/.libs/formatter_data.o formatter/.libs/formatter_format.o formatter/.libs/formatter_main.o formatter/.libs/formatter_parse.o grapheme/.libs/grapheme_string.o grapheme/.libs/grapheme_util.o idn/.libs/idn.o .libs/intl_convert.o .libs/intl_error.o locale/.libs/locale_class.o locale/.libs/locale_methods.o locale/.libs/locale.o msgformat/.libs/msgformat_attr.o msgformat/.libs/msgformat_class.o msgformat/.libs/msgformat_data.o msgformat/.libs/msgformat_format.o msgformat/.libs/msgformat_parse.o msgformat/.libs/msgformat.o normalizer/.libs/normalizer_class.o normalizer/.libs/normalizer_normalize.o .libs/php_intl.o resourcebundle/.libs/resourcebundle_class.o resourcebundle/.libs/resourcebundle_iterator.o resourcebundle/.libs/resourcebundle.o spoofchecker/.libs/spoofchecker_class.o spoofchecker/.libs/spoofchecker_create.o spoofchecker/.libs/spoofchecker_main.o transliterator/.libs/transliterator_class.o transliterator/.libs/transliterator_methods.o uchar/.libs/uchar.o .libs/intl_convertcpp.o common/.libs/common_enum.o common/.libs/common_date.o dateformat/.libs/dateformat_format_object.o dateformat/.libs/dateformat_create.o dateformat/.libs/dateformat_attrcpp.o dateformat/.libs/dateformat_helpers.o dateformat/.libs/datepatterngenerator_class.o dateformat/.libs/datepatterngenerator_methods.o msgformat/.libs/msgformat_helpers.o timezone/.libs/timezone_class.o timezone/.libs/timezone_methods.o calendar/.libs/calendar_class.o calendar/.libs/calendar_methods.o calendar/.libs/gregoriancalendar_methods.o breakiterator/.libs/breakiterator_class.o breakiterator/.libs/breakiterator_iterators.o breakiterator/.libs/breakiterator_methods.o breakiterator/.libs/rulebasedbreakiterator_methods.o breakiterator/.libs/codepointiterator_internal.o breakiterator/.libs/codepointiterator_methods.o  -licuio -licui18n -licuuc -L/usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0 -L/usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/../../../../x86_64-alpine-linux-musl/lib/../lib -L/usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/../../../../lib -L/lib/../lib -L/usr/lib/../lib -L/usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/../../../../x86_64-alpine-linux-musl/lib -L/usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/../../.. -L/lib -L/usr/lib -lstdc++ -lm -lssp_nonshared -lc -lgcc_s /usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/crtendS.o /usr/lib/gcc/x86_64-alpine-linux-musl/15.2.0/../../../../lib/crtn.o  -Wl,-O1 -Wl,-soname -Wl,intl.so -o .libs/intl.so
creating intl.la
(cd .libs && rm -f intl.la && ln -s ../intl.la intl.la)
/bin/sh /usr/src/php/ext/intl/libtool --tag=CXX --mode=install cp ./intl.la /usr/src/php/ext/intl/modules
cp ./.libs/intl.so /usr/src/php/ext/intl/modules/intl.so
cp ./.libs/intl.lai /usr/src/php/ext/intl/modules/intl.la
PATH="$PATH:/sbin" ldconfig -n /usr/src/php/ext/intl/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/src/php/ext/intl/modules
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
+ strip --strip-all modules/intl.so
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
(1/1) Purging .phpize-deps (20260812.111457)
OK: 921.2 MiB in 159 packages
### INSTALLING BUNDLED MODULE pcntl ###
(1/1) Installing .phpize-deps (20260812.111600)
OK: 921.2 MiB in 160 packages
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
(1/1) Purging .phpize-deps (20260812.111600)
OK: 921.2 MiB in 159 packages
### INSTALLING REMOTE MODULE redis ###
downloading redis-6.3.0.tgz ...
Starting to download redis-6.3.0.tgz (399,284 bytes)
......done: 399,284 bytes
43 source files, building
running: phpize
Configuring for:
PHP Version:             8.4
PHP Api Version:         20240924
Zend Module Api No:      20240924
Zend Extension Api No:   420240924
enable igbinary serializer support? [no] : enable lzf compression support? [no] : enable zstd compression support? [no] : enable msgpack serializer support? [no] : enable lz4 compression? [no] : use system liblz4? [yes] : building in /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0
running: /tmp/pear/temp/redis/configure --with-php-config=/usr/local/bin/php-config --enable-redis-igbinary=no --enable-redis-lzf=yes --enable-redis-zstd=yes --enable-redis-msgpack=no --enable-redis-lz4=yes --with-liblz4
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
checking whether to enable redis support... yes, shared
checking whether to enable sessions... yes
checking whether to enable json serializer support... yes
checking whether to enable igbinary serializer support... no
checking whether to enable msgpack serializer support... no
checking whether to enable lzf compression... yes
checking use system liblzf... no
checking whether to enable Zstd compression... yes
checking use system libzstd... yes
checking whether to enable lz4 compression... yes
checking use system liblz4... yes
checking for hash includes... /usr/local/include/php
checking for json includes... /usr/local/include/php
checking for redis json support... enabled
checking for redis igbinary support... disabled
checking for pkg-config... /usr/bin/pkg-config
checking for liblz4 using pkg-config... found version 1.10.0
checking for libzstd using pkg-config... found version 1.5.7
checking for git... no
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
running: make -j2
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis.c -o redis.lo  -MMD -MF redis.dep -MT redis.lo
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_commands.c -o redis_commands.lo  -MMD -MF redis_commands.dep -MT redis_commands.lo
mkdir .libs
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis.c -MMD -MF redis.dep -MT redis.lo  -fPIC -DPIC -o .libs/redis.o
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_commands.c -MMD -MF redis_commands.dep -MT redis_commands.lo  -fPIC -DPIC -o .libs/redis_commands.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/library.c -o library.lo  -MMD -MF library.dep -MT library.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/library.c -MMD -MF library.dep -MT library.lo  -fPIC -DPIC -o .libs/library.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_session.c -o redis_session.lo  -MMD -MF redis_session.dep -MT redis_session.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_session.c -MMD -MF redis_session.dep -MT redis_session.lo  -fPIC -DPIC -o .libs/redis_session.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_array.c -o redis_array.lo  -MMD -MF redis_array.dep -MT redis_array.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_array.c -MMD -MF redis_array.dep -MT redis_array.lo  -fPIC -DPIC -o .libs/redis_array.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_array_impl.c -o redis_array_impl.lo  -MMD -MF redis_array_impl.dep -MT redis_array_impl.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_array_impl.c -MMD -MF redis_array_impl.dep -MT redis_array_impl.lo  -fPIC -DPIC -o .libs/redis_array_impl.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_cluster.c -o redis_cluster.lo  -MMD -MF redis_cluster.dep -MT redis_cluster.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_cluster.c -MMD -MF redis_cluster.dep -MT redis_cluster.lo  -fPIC -DPIC -o .libs/redis_cluster.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/cluster_library.c -o cluster_library.lo  -MMD -MF cluster_library.dep -MT cluster_library.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/cluster_library.c -MMD -MF cluster_library.dep -MT cluster_library.lo  -fPIC -DPIC -o .libs/cluster_library.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_sentinel.c -o redis_sentinel.lo  -MMD -MF redis_sentinel.dep -MT redis_sentinel.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/redis_sentinel.c -MMD -MF redis_sentinel.dep -MT redis_sentinel.lo  -fPIC -DPIC -o .libs/redis_sentinel.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/sentinel_library.c -o sentinel_library.lo  -MMD -MF sentinel_library.dep -MT sentinel_library.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/sentinel_library.c -MMD -MF sentinel_library.dep -MT sentinel_library.lo  -fPIC -DPIC -o .libs/sentinel_library.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/backoff.c -o backoff.lo  -MMD -MF backoff.dep -MT backoff.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/backoff.c -MMD -MF backoff.dep -MT backoff.lo  -fPIC -DPIC -o .libs/backoff.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/liblzf/lzf_c.c -o liblzf/lzf_c.lo  -MMD -MF liblzf/lzf_c.dep -MT liblzf/lzf_c.lo
mkdir liblzf/.libs
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/liblzf/lzf_c.c -MMD -MF liblzf/lzf_c.dep -MT liblzf/lzf_c.lo  -fPIC -DPIC -o liblzf/.libs/lzf_c.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=compile cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/liblzf/lzf_d.c -o liblzf/lzf_d.lo  -MMD -MF liblzf/lzf_d.dep -MT liblzf/lzf_d.lo
 cc -I. -I/tmp/pear/temp/redis -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf -DHAVE_CONFIG_H -g -O2 -D_GNU_SOURCE -DZEND_COMPILE_DL_EXT=1 -c /tmp/pear/temp/redis/liblzf/lzf_d.c -MMD -MF liblzf/lzf_d.dep -MT liblzf/lzf_d.lo  -fPIC -DPIC -o liblzf/.libs/lzf_d.o
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=link cc -shared -I/usr/local/include/php -I/usr/local/include/php/main -I/usr/local/include/php/TSRM -I/usr/local/include/php/Zend -I/usr/local/include/php/ext -I/usr/local/include/php/ext/date/lib -I/usr/local/include/php/ext -I/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/liblzf -I/tmp/pear/temp/redis/liblzf  -DHAVE_CONFIG_H  -g -O2 -D_GNU_SOURCE    -o redis.la -export-dynamic -avoid-version -prefer-pic -module -rpath /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/modules  redis.lo redis_commands.lo library.lo redis_session.lo redis_array.lo redis_array_impl.lo redis_cluster.lo cluster_library.lo redis_sentinel.lo sentinel_library.lo backoff.lo liblzf/lzf_c.lo liblzf/lzf_d.lo -llz4 -lzstd
cc -shared  .libs/redis.o .libs/redis_commands.o .libs/library.o .libs/redis_session.o .libs/redis_array.o .libs/redis_array_impl.o .libs/redis_cluster.o .libs/cluster_library.o .libs/redis_sentinel.o .libs/sentinel_library.o .libs/backoff.o liblzf/.libs/lzf_c.o liblzf/.libs/lzf_d.o  -llz4 -lzstd  -Wl,-soname -Wl,redis.so -o .libs/redis.so
creating redis.la
(cd .libs && rm -f redis.la && ln -s ../redis.la redis.la)
/bin/sh /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/libtool --tag=CC --mode=install cp ./redis.la /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/modules
cp ./.libs/redis.so /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/modules/redis.so
cp ./.libs/redis.lai /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/modules/redis.la
PATH="$PATH:/sbin" ldconfig -n /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/modules
----------------------------------------------------------------------
Libraries have been installed in:
   /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/redis-6.3.0/modules
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
running: make -j2 INSTALL_ROOT="/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0" install
Installing shared extensions:     /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local/lib/php/extensions/no-debug-zts-20240924/
running: find "/tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0" | xargs ls -dils
4635413      4 drwxr-xr-x    3 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0
4635472      4 drwxr-xr-x    3 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr
4635473      4 drwxr-xr-x    3 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local
4635474      4 drwxr-xr-x    3 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local/lib
4635475      4 drwxr-xr-x    3 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local/lib/php
4635476      4 drwxr-xr-x    3 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local/lib/php/extensions
4635477      4 drwxr-xr-x    2 root     root          4096 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local/lib/php/extensions/no-debug-zts-20240924
4635471   2684 -rwxr-xr-x    1 root     root       2748008 Aug 12 11:16 /tmp/pear/temp/pear-build-defaultuserd6pul18go039bidbohb/install-redis-6.3.0/usr/local/lib/php/extensions/no-debug-zts-20240924/redis.so
Build process completed successfully
Installing '/usr/local/lib/php/extensions/no-debug-zts-20240924/redis.so'
install ok: channel://pecl.php.net/redis-6.3.0
configuration option "php_ini" is not set to php.ini location
You should add "extension=redis.so" to php.ini
Removing symbols from /usr/local/lib/php/extensions/no-debug-zts-20240924/redis.so... done (2078112 bytes saved).
Check if the redis module can be loaded... ok.
### REMOVING UNNEEDED PACKAGES ###
( 1/83) Purging autoconf (2.73-r0)
( 2/83) Purging m4 (1.4.20-r1)
( 3/83) Purging cmake (4.2.3-r0)
( 4/83) Purging dpkg (1.23.7-r0)
( 5/83) Purging dpkg-dev (1.23.7-r0)
( 6/83) Purging perl (5.42.2-r0)
( 7/83) Purging file (5.47-r2)
( 8/83) Purging freetype-dev (2.14.3-r0)
( 9/83) Purging g++ (15.2.0-r5)
(10/83) Purging gcc (15.2.0-r5)
(11/83) Purging binutils (2.45.1-r1)
(12/83) Purging libatomic (15.2.0-r5)
(13/83) Purging libgomp (15.2.0-r5)
(14/83) Purging isl26 (0.26-r2)
(15/83) Purging jansson (2.15.0-r0)
(16/83) Purging libarchive (3.8.7-r0)
(17/83) Purging libavif-dev (1.4.1-r0)
(18/83) Purging libjpeg-turbo-dev (3.1.3-r0)
(19/83) Purging libturbojpeg (3.1.3-r0)
(20/83) Purging libmagic (5.47-r2)
(21/83) Purging libpng-dev (1.6.58-r1)
(22/83) Purging libuv (1.52.1-r0)
(23/83) Purging libwebp-dev (1.6.0-r0)
(24/83) Purging libwebpdecoder (1.6.0-r0)
(25/83) Purging libwebpdemux (1.6.0-r0)
(26/83) Purging libwebpmux (1.6.0-r0)
(27/83) Purging libxpm-dev (3.5.19-r0)
(28/83) Purging libzip-dev (1.11.4-r2)
(29/83) Purging libzip-tools (1.11.4-r2)
(30/83) Purging bzip2-dev (1.0.8-r6)
(31/83) Purging xz-dev (5.8.3-r0)
(32/83) Purging zlib-dev (1.3.2-r0)
(33/83) Purging make (4.4.1-r4)
(34/83) Purging mpc1 (1.3.1-r1)
(35/83) Purging mpfr4 (4.2.2-r0)
(36/83) Purging postgresql18-dev (18.4-r0)
(37/83) Purging libecpg-dev (18.4-r0)
(38/83) Purging liburing-dev (2.14-r0)
(39/83) Purging liburing-ffi (2.14-r0)
(40/83) Purging liburing (2.14-r0)
(41/83) Purging clang22 (22.1.3-r2)
(42/83) Purging fortify-headers (3.0.1-r2)
(43/83) Purging libgcc-static (15.2.0-r5)
(44/83) Purging libstdc++-dev (15.2.0-r5)
(45/83) Purging musl-dev (1.2.6-r2)
(46/83) Purging clang22-headers (22.1.3-r2)
(47/83) Purging icu-dev (78.1-r0)
(48/83) Purging llvm22 (22.1.3-r0)
(49/83) Purging llvm22-linker-tools (22.1.3-r0)
(50/83) Purging lz4-dev (1.10.0-r1)
(51/83) Purging zstd-dev (1.5.7-r2)
(52/83) Purging zstd (1.5.7-r2)
(53/83) Purging python3-pyc (3.14.5-r0)
(54/83) Purging python3-pycache-pyc0 (3.14.5-r0)
(55/83) Purging xcb-proto-pyc (1.17.0-r1)
(56/83) Purging pyc (3.14.5-r0)
(57/83) Purging re2c (4.5.1-r0)
(58/83) Purging rhash-libs (1.4.6-r0)
(59/83) Purging aom-dev (3.14.1-r0)
(60/83) Purging aom (3.14.1-r0)
(61/83) Purging brotli-dev (1.2.0-r1)
(62/83) Purging brotli (1.2.0-r1)
(63/83) Purging clang22-libs (22.1.3-r2)
(64/83) Purging dav1d-dev (1.5.3-r0)
(65/83) Purging libx11-dev (1.8.13-r0)
(66/83) Purging xtrans (1.6.0-r0)
(67/83) Purging libxcb-dev (1.17.0-r2)
(68/83) Purging xcb-proto (1.17.0-r1)
(69/83) Purging python3 (3.14.5-r0)
(70/83) Purging gdbm (1.26-r0)
(71/83) Purging gmp (6.3.0-r4)
(72/83) Purging icu (78.1-r0)
(73/83) Purging libexpat (2.8.2-r0)
(74/83) Purging llvm22-libs (22.1.3-r0)
(75/83) Purging libffi (3.5.2-r1)
(76/83) Purging libpanelw (6.6_p20260516-r0)
(77/83) Purging libpq-dev (18.4-r0)
(78/83) Purging libxau-dev (1.0.12-r0)
(79/83) Purging libxdmcp-dev (1.1.5-r1)
(80/83) Purging mpdecimal (4.0.1-r0)
(81/83) Purging openssl-dev (3.5.7-r0)
(82/83) Purging xorgproto (2025.1-r0)
(83/83) Purging pkgconf (2.5.1-r0)
Executing busybox-1.37.0-r31.trigger
OK: 78.0 MiB in 76 packages
Removing intermediate container bb886993910d
 ---> 509b157f4b91
Step 6/15 : WORKDIR /var/www/html
 ---> Running in 33cbe1174861
Removing intermediate container 33cbe1174861
 ---> 1d20901f256f
Step 7/15 : COPY apps/api/composer.json apps/api/composer.lock ./
 ---> 1d93b83f9bdf
Step 8/15 : RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts
 ---> Running in c43267b81c2d
Installing dependencies from lock file
Verifying lock file contents can be installed on current platform.
Package operations: 111 installs, 0 updates, 0 removals
  - Downloading voku/portable-ascii (2.1.1)
  - Downloading symfony/polyfill-php80 (v1.37.0)
  - Downloading symfony/polyfill-mbstring (v1.38.2)
  - Downloading symfony/polyfill-ctype (v1.37.0)
  - Downloading phpoption/phpoption (1.9.5)
  - Downloading graham-campbell/result-type (v1.1.4)
  - Downloading vlucas/phpdotenv (v5.6.4)
  - Downloading symfony/css-selector (v8.1.0)
  - Downloading tijsverkoyen/css-to-inline-styles (v2.4.0)
  - Downloading symfony/var-dumper (v8.1.2)
  - Downloading symfony/polyfill-uuid (v1.37.0)
  - Downloading symfony/uid (v8.1.4)
  - Downloading symfony/deprecation-contracts (v3.7.1)
  - Downloading symfony/routing (v8.1.2)
  - Downloading symfony/process (v8.1.0)
  - Downloading symfony/polyfill-php86 (v1.41.0)
  - Downloading symfony/polyfill-php85 (v1.41.0)
  - Downloading symfony/polyfill-php84 (v1.38.1)
  - Downloading symfony/polyfill-intl-normalizer (v1.38.0)
  - Downloading symfony/polyfill-intl-idn (v1.38.1)
  - Downloading symfony/mime (v8.1.4)
  - Downloading psr/container (2.0.2)
  - Downloading symfony/service-contracts (v3.7.1)
  - Downloading psr/event-dispatcher (1.0.0)
  - Downloading symfony/event-dispatcher-contracts (v3.7.1)
  - Downloading symfony/event-dispatcher (v8.1.2)
  - Downloading psr/log (3.0.2)
  - Downloading doctrine/lexer (3.0.1)
  - Downloading egulias/email-validator (4.0.4)
  - Downloading symfony/mailer (v8.1.2)
  - Downloading symfony/http-foundation (v8.1.4)
  - Downloading symfony/error-handler (v8.1.2)
  - Downloading symfony/http-kernel (v8.1.4)
  - Downloading symfony/finder (v8.1.1)
  - Downloading symfony/polyfill-intl-grapheme (v1.41.0)
  - Downloading symfony/string (v8.1.2)
  - Downloading symfony/console (v8.1.4)
  - Downloading ramsey/collection (2.1.1)
  - Downloading brick/math (0.18.0)
  - Downloading ramsey/uuid (4.9.3)
  - Downloading psr/simple-cache (3.0.0)
  - Downloading nunomaduro/termwind (v2.4.0)
  - Downloading symfony/translation-contracts (v3.7.1)
  - Downloading symfony/translation (v8.1.4)
  - Downloading psr/clock (1.0.0)
  - Downloading symfony/clock (v8.1.0)
  - Downloading carbonphp/carbon-doctrine-types (3.2.0)
  - Downloading nesbot/carbon (3.13.1)
  - Downloading monolog/monolog (3.10.0)
  - Downloading psr/http-message (2.0)
  - Downloading psr/http-factory (1.1.0)
  - Downloading league/uri-interfaces (7.8.1)
  - Downloading league/uri (7.8.1)
  - Downloading league/mime-type-detection (1.17.0)
  - Downloading league/flysystem-local (3.31.0)
  - Downloading league/flysystem (3.35.2)
  - Downloading nette/utils (v4.1.5)
  - Downloading nette/schema (v1.3.5)
  - Downloading dflydev/dot-access-data (v3.0.3)
  - Downloading league/config (v1.2.0)
  - Downloading league/commonmark (2.9.0)
  - Downloading laravel/serializable-closure (v2.0.15)
  - Downloading laravel/prompts (v0.3.22)
  - Downloading guzzlehttp/uri-template (v1.0.10)
  - Downloading guzzlehttp/promises (2.5.2)
  - Downloading psr/http-client (1.0.3)
  - Downloading ralouphie/getallheaders (3.0.3)
  - Downloading guzzlehttp/psr7 (2.13.0)
  - Downloading guzzlehttp/guzzle (7.15.3)
  - Downloading fruitcake/php-cors (v1.4.0)
  - Downloading dragonmantank/cron-expression (v3.6.0)
  - Downloading doctrine/inflector (2.1.0)
  - Downloading laravel/framework (v13.24.0)
  - Downloading masterminds/html5 (2.10.1)
  - Downloading thecodingmachine/safe (v3.4.0)
  - Downloading sabberworm/php-css-parser (v9.4.0)
  - Downloading dompdf/php-svg-lib (1.0.2)
  - Downloading dompdf/php-font-lib (1.0.2)
  - Downloading dompdf/dompdf (v3.1.6)
  - Downloading barryvdh/laravel-dompdf (v3.1.2)
  - Downloading clue/redis-protocol (v0.3.2)
  - Downloading jean85/pretty-package-versions (2.1.1)
  - Downloading symfony/psr-http-message-bridge (v8.1.0)
  - Downloading laminas/laminas-diactoros (3.8.0)
  - Downloading laravel/octane (v2.19.0)
  - Downloading livewire/livewire (v4.3.5)
  - Downloading laravel/sentinel (v1.1.0)
  - Downloading doctrine/sql-formatter (1.5.4)
  - Downloading laravel/pulse (v1.8.0)
  - Downloading react/event-loop (v1.6.0)
  - Downloading evenement/evenement (v3.0.2)
  - Downloading react/stream (v1.4.0)
  - Downloading react/promise (v3.3.0)
  - Downloading react/cache (v1.2.0)
  - Downloading react/dns (v1.14.0)
  - Downloading react/socket (v1.17.0)
  - Downloading react/promise-timer (v1.11.0)
  - Downloading nyholm/psr7 (1.8.2)
  - Downloading ratchet/rfc6455 (v0.4.1)
  - Downloading pusher/pusher-php-server (7.3.0)
  - Downloading clue/redis-react (v2.8.0)
  - Downloading laravel/reverb (v1.11.0)
  - Downloading laravel/sanctum (v4.3.3)
  - Downloading nikic/php-parser (v5.8.0)
  - Downloading psy/psysh (v0.12.24)
  - Downloading laravel/tinker (v3.0.2)
  - Downloading symfony/options-resolver (v8.1.0)
  - Downloading sentry/sentry (4.30.0)
  - Downloading sentry/sentry-laravel (4.27.0)
  - Downloading openspout/openspout (v4.32.0)
  - Downloading spatie/simple-excel (3.10.0)
   0/111 [>---------------------------]   0%
  14/111 [===>------------------------]  12%
  25/111 [======>---------------------]  22%
  37/111 [=========>------------------]  33%
  46/111 [===========>----------------]  41%
  57/111 [==============>-------------]  51%
  - Installing ralouphie/getallheaders (3.0.3): Extracting archive
  - Installing guzzlehttp/psr7 (2.13.0): Extracting archive
  - Installing guzzlehttp/guzzle (7.15.3): Extracting archive
  - Installing fruitcake/php-cors (v1.4.0): Extracting archive
  - Installing dragonmantank/cron-expression (v3.6.0): Extracting archive
  - Installing doctrine/inflector (2.1.0): Extracting archive
  - Installing laravel/framework (v13.24.0): Extracting archive
  - Installing masterminds/html5 (2.10.1): Extracting archive
  - Installing thecodingmachine/safe (v3.4.0): Extracting archive
  - Installing sabberworm/php-css-parser (v9.4.0): Extracting archive
  - Installing dompdf/php-svg-lib (1.0.2): Extracting archive
  - Installing dompdf/php-font-lib (1.0.2): Extracting archive
  - Installing dompdf/dompdf (v3.1.6): Extracting archive
  - Installing barryvdh/laravel-dompdf (v3.1.2): Extracting archive
  - Installing clue/redis-protocol (v0.3.2): Extracting archive
  - Installing jean85/pretty-package-versions (2.1.1): Extracting archive
  - Installing symfony/psr-http-message-bridge (v8.1.0): Extracting archive
  - Installing laminas/laminas-diactoros (3.8.0): Extracting archive
  - Installing laravel/octane (v2.19.0): Extracting archive
  - Installing livewire/livewire (v4.3.5): Extracting archive
  - Installing laravel/sentinel (v1.1.0): Extracting archive
  - Installing doctrine/sql-formatter (1.5.4): Extracting archive
  - Installing laravel/pulse (v1.8.0): Extracting archive
  - Installing react/event-loop (v1.6.0): Extracting archive
  - Installing evenement/evenement (v3.0.2): Extracting archive
  - Installing react/stream (v1.4.0): Extracting archive
  - Installing react/promise (v3.3.0): Extracting archive
  - Installing react/cache (v1.2.0): Extracting archive
  - Installing react/dns (v1.14.0): Extracting archive
  - Installing react/socket (v1.17.0): Extracting archive
  - Installing react/promise-timer (v1.11.0): Extracting archive
  - Installing nyholm/psr7 (1.8.2): Extracting archive
  - Installing ratchet/rfc6455 (v0.4.1): Extracting archive
  - Installing pusher/pusher-php-server (7.3.0): Extracting archive
  - Installing clue/redis-react (v2.8.0): Extracting archive
  - Installing laravel/reverb (v1.11.0): Extracting archive
  - Installing laravel/sanctum (v4.3.3): Extracting archive
  - Installing nikic/php-parser (v5.8.0): Extracting archive
  - Installing psy/psysh (v0.12.24): Extracting archive
  - Installing laravel/tinker (v3.0.2): Extracting archive
  - Installing symfony/options-resolver (v8.1.0): Extracting archive
  - Installing sentry/sentry (4.30.0): Extracting archive
  - Installing sentry/sentry-laravel (4.27.0): Extracting archive
  - Installing openspout/openspout (v4.32.0): Extracting archive
  - Installing spatie/simple-excel (3.10.0): Extracting archive
   0/111 [>---------------------------]   0%
  20/111 [=====>----------------------]  18%
  30/111 [=======>--------------------]  27%
  40/111 [==========>-----------------]  36%
  47/111 [===========>----------------]  42%
  56/111 [==============>-------------]  50%
  69/111 [=================>----------]  62%
  81/111 [====================>-------]  72%
  93/111 [=======================>----]  83%
 100/111 [=========================>--]  90%
 111/111 [============================] 100%
Generating optimized autoload files
73 packages you are using are looking for funding.
Use the `composer fund` command to find out more!
Removing intermediate container c43267b81c2d
 ---> 7818e3a7b5de
Step 9/15 : COPY apps/api/ .
 ---> faaecfd8a8c3
Step 10/15 : RUN mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions              storage/framework/views storage/app/public bootstrap/cache     && chmod -R 775 storage bootstrap/cache
 ---> Running in f4b55b8e44af
Removing intermediate container f4b55b8e44af
 ---> e61157e6463a
Step 11/15 : RUN composer dump-autoload --no-dev --optimize     && printf "<?php require_once '/var/www/html/vendor/autoload.php';" > preload.php
 ---> Running in ad61a76873f3
Generating optimized autoload files
> Illuminate\Foundation\ComposerScripts::postAutoloadDump
> @php artisan package:discover --ansi
   INFO  Discovering packages.  
  barryvdh/laravel-dompdf ............................................... DONE
  laravel/octane ........................................................ DONE
  laravel/pulse ......................................................... DONE
  laravel/reverb ........................................................ DONE
  laravel/sanctum ....................................................... DONE
  laravel/sentinel ...................................................... DONE
  laravel/tinker ........................................................ DONE
  livewire/livewire ..................................................... DONE
  nesbot/carbon ......................................................... DONE
  nunomaduro/termwind ................................................... DONE
  sentry/sentry-laravel ................................................. DONE
Generated optimized autoload files containing 6248 classes
Removing intermediate container ad61a76873f3
 ---> 11af36ca3ab5
Step 12/15 : RUN php artisan route:cache && php artisan view:cache
 ---> Running in f7daa1bc66d5
   INFO  Routes cached successfully.  
   INFO  Blade templates cached successfully.  
Removing intermediate container f7daa1bc66d5
 ---> b9aeab608b46
Step 13/15 : RUN php artisan storage:link || true
 ---> Running in 2f113c514507
   INFO  The [public/storage] link has been connected to [storage/app/public].  
Removing intermediate container 2f113c514507
 ---> f080a0e6170f
Step 14/15 : EXPOSE 8080
 ---> Running in ff9b4fee25d3
Removing intermediate container ff9b4fee25d3
 ---> 0beb66cbdacf
Step 15/15 : CMD ["sh", "start.sh"]
 ---> Running in 25fb825fe9ee
Removing intermediate container 25fb825fe9ee
 ---> 0beba8c5b3d3
Successfully built 0beba8c5b3d3
Successfully tagged asia-south1-docker.pkg.dev/gen-lang-client-0786468307/g4k/g4k-api:ba36045
Finished Step #0 - "Build"
Starting Step #1 - "Push"
Already have image (with digest): gcr.io/cloud-builders/docker
The push refers to repository [asia-south1-docker.pkg.dev/gen-lang-client-0786468307/g4k/g4k-api]
4a8c65d2afa8: Preparing
48f031bfab7d: Preparing
02f274855718: Preparing
a21d4e510ac1: Preparing
dd2f4b4f505e: Preparing
f2d00d774625: Preparing
915cb0468b66: Preparing
9e313af7445e: Preparing
4a9d3002bda9: Preparing
97c894e2cec9: Preparing
5f70bf18a086: Preparing
66930eef65d9: Preparing
02991292b528: Preparing
e13f5b31da06: Preparing
8c03412a2531: Preparing
b7d1b8bc6481: Preparing
11d8baf72c72: Preparing
62cd23d459f7: Preparing
3479aec3cff3: Preparing
444284afe193: Preparing
6f4d1ec013b4: Preparing
660f75c422ec: Preparing
5ee6fee6f780: Preparing
463f9dd1d59c: Preparing
c993fc30556b: Preparing
8e1adfba5f43: Preparing
5a4725ed98a9: Preparing
99eeb4c273d4: Preparing
a1bbf1ea6580: Preparing
34884abbe928: Preparing
11d8baf72c72: Waiting
62cd23d459f7: Waiting
3479aec3cff3: Waiting
444284afe193: Waiting
6f4d1ec013b4: Waiting
660f75c422ec: Waiting
5ee6fee6f780: Waiting
463f9dd1d59c: Waiting
c993fc30556b: Waiting
8e1adfba5f43: Waiting
5a4725ed98a9: Waiting
99eeb4c273d4: Waiting
a1bbf1ea6580: Waiting
34884abbe928: Waiting
5f70bf18a086: Waiting
66930eef65d9: Waiting
02991292b528: Waiting
e13f5b31da06: Waiting
8c03412a2531: Waiting
b7d1b8bc6481: Waiting
4a8c65d2afa8: Pushed
02f274855718: Pushed
915cb0468b66: Pushed
97c894e2cec9: Pushed
48f031bfab7d: Pushed
4a9d3002bda9: Pushed
dd2f4b4f505e: Pushed
a21d4e510ac1: Pushed
5f70bf18a086: Layer already exists
66930eef65d9: Layer already exists
02991292b528: Layer already exists
8c03412a2531: Layer already exists
11d8baf72c72: Layer already exists
b7d1b8bc6481: Layer already exists
e13f5b31da06: Layer already exists
62cd23d459f7: Layer already exists
3479aec3cff3: Layer already exists
6f4d1ec013b4: Layer already exists
444284afe193: Layer already exists
660f75c422ec: Layer already exists
5ee6fee6f780: Layer already exists
463f9dd1d59c: Layer already exists
5a4725ed98a9: Layer already exists
a1bbf1ea6580: Layer already exists
8e1adfba5f43: Layer already exists
c993fc30556b: Layer already exists
99eeb4c273d4: Layer already exists
34884abbe928: Layer already exists
9e313af7445e: Pushed
f2d00d774625: Pushed
ba36045: digest: sha256:2a4196f003791115384bdd6231dc2722fbf176019d0672129df973de11cfc004 size: 6592
Finished Step #1 - "Push"
Starting Step #2 - "Deploy"
Pulling image: google/cloud-sdk:slim
slim: Pulling from google/cloud-sdk
26c307b5e35a: Pulling fs layer
9936d66e009c: Pulling fs layer
4f4fb700ef54: Pulling fs layer
b2ccb904ac19: Pulling fs layer
f78969bb2bf4: Pulling fs layer
f78969bb2bf4: Download complete
9936d66e009c: Download complete
4f4fb700ef54: Download complete
26c307b5e35a: Verifying Checksum
26c307b5e35a: Download complete
26c307b5e35a: Pull complete
9936d66e009c: Pull complete
4f4fb700ef54: Pull complete
b2ccb904ac19: Verifying Checksum
b2ccb904ac19: Download complete
b2ccb904ac19: Pull complete
f78969bb2bf4: Pull complete
Digest: sha256:11901dc1a8e6da464f2a7259d503166ab7c55092dbc41373b65c7c676ff6f8f4
Status: Downloaded newer image for google/cloud-sdk:slim
docker.io/google/cloud-sdk:slim
Deploying container to Cloud Run service [g4k-api] in project [gen-lang-client-0786468307] region [asia-south1]
Deploying...
Setting IAM Policy...............done
Creating Revision..........failed
Deployment failed
ERROR: (gcloud.run.deploy) spec.template.spec.containers[0].env[0].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-app-key/versions/latest was not found
spec.template.spec.containers[0].env[1].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-db-password/versions/latest was not found
spec.template.spec.containers[0].env[2].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-reverb-app-id/versions/latest was not found
spec.template.spec.containers[0].env[3].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-reverb-app-key/versions/latest was not found
spec.template.spec.containers[0].env[4].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-reverb-app-secret/versions/latest was not found
spec.template.spec.containers[0].env[5].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-s3-key/versions/latest was not found
spec.template.spec.containers[0].env[6].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-s3-secret/versions/latest was not found
spec.template.spec.containers[0].env[7].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-sentry-dsn/versions/latest was not found
spec.template.spec.containers[0].env[8].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-mail-password/versions/latest was not found
Finished Step #2 - "Deploy"
ERROR
ERROR: build step 2 "google/cloud-sdk:slim" failed: step exited with non-zero status: 1

Pulling image: google/cloud-sdk:slim
slim: Pulling from google/cloud-sdk
26c307b5e35a: Pulling fs layer
9936d66e009c: Pulling fs layer
4f4fb700ef54: Pulling fs layer
b2ccb904ac19: Pulling fs layer
f78969bb2bf4: Pulling fs layer
f78969bb2bf4: Download complete
9936d66e009c: Download complete
4f4fb700ef54: Download complete
26c307b5e35a: Verifying Checksum
26c307b5e35a: Download complete
26c307b5e35a: Pull complete
9936d66e009c: Pull complete
4f4fb700ef54: Pull complete
b2ccb904ac19: Verifying Checksum
b2ccb904ac19: Download complete
b2ccb904ac19: Pull complete
f78969bb2bf4: Pull complete
Digest: sha256:11901dc1a8e6da464f2a7259d503166ab7c55092dbc41373b65c7c676ff6f8f4
Status: Downloaded newer image for google/cloud-sdk:slim
docker.io/google/cloud-sdk:slim
Deploying container to Cloud Run service [g4k-api] in project [gen-lang-client-0786468307] region [asia-south1]
Deploying...
Setting IAM Policy...............done
Creating Revision..........failed
Deployment failed
ERROR: (gcloud.run.deploy) spec.template.spec.containers[0].env[0].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-app-key/versions/latest was not found
spec.template.spec.containers[0].env[1].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-db-password/versions/latest was not found
spec.template.spec.containers[0].env[2].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-reverb-app-id/versions/latest was not found
spec.template.spec.containers[0].env[3].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-reverb-app-key/versions/latest was not found
spec.template.spec.containers[0].env[4].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-reverb-app-secret/versions/latest was not found
spec.template.spec.containers[0].env[5].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-s3-key/versions/latest was not found
spec.template.spec.containers[0].env[6].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-s3-secret/versions/latest was not found
spec.template.spec.containers[0].env[7].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-sentry-dsn/versions/latest was not found
spec.template.spec.containers[0].env[8].value_from.secret_key_ref.name: Secret projects/579515345084/secrets/g4k-mail-password/versions/latest was not found