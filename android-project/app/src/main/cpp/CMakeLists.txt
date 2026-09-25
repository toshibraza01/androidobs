cmake_minimum_required(VERSION 3.22.1)

project("obs-core")

add_library(
    obs-core
    SHARED
    obs-core.cpp
)

find_library(
    log-lib
    log
)

find_library(
    gles3-lib
    GLESv3
)

find_library(
    egl-lib
    EGL
)

find_library(
    android-lib
    android
)

target_link_libraries(
    obs-core
    ${log-lib}
    ${gles3-lib}
    ${egl-lib}
    ${android-lib}
)