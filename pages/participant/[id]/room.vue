<template>
    <div class="flex w-full min-h-screen overflow-hidden">

    <div v-if="roomDoesntExist" class="flex flex-col items-center justify-center p-8 bg-gray-100 w-screen gap-4 min-h-screen">
        <div class="text-center space-y-4">
            <p class="text-lg text-gray-700">❌ Sorry, this room doesn't exist.</p>
            <p class="text-sm text-gray-500">Please contact the host to create a new room.</p>
            <button 
                class="flex items-center justify-center gap-2 text-sm bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none transition-colors"
                @click="goHome"
            >
                🏠 Back to Home
            </button>
        </div>
    </div>
    <div v-else class="flex flex-col w-full h-screen items-center overflow-hidden">
        <div class="flex w-full bg-[#3b62f0] p-2 lg:p-4 text-white w-full items-center">
            <div class="flex flex-col flex-1 min-w-0">
                <p class="text-[10px] lg:text-xs">Room's ID</p>
                <p class="font-bold text-sm lg:text-xl truncate">{{ roomID }}</p>
            </div>
            
            <div class="flex gap-1 lg:gap-2 justify-end flex-1 overflow-x-auto">
                <!-- FULLSCREEN BUTTON -->
                <button 
                    v-if="!totalDurationTime"
                    class="h-[30px] w-[30px] lg:h-[35px] lg:w-[35px] flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg focus:outline-none text-base lg:text-lg flex-shrink-0"
                    @click="toggleFullscreen"
                    :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
                >
                    {{ isFullscreen ? '⛶' : '⛶' }}
                </button>
                
                <!-- PTZ TOGGLE - MOVED HERE WITH MORE SPACE -->
                <button 
                    v-if="!totalDurationTime"
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs text-white rounded-lg px-2 lg:px-3 py-1 focus:outline-none whitespace-nowrap transition-colors flex-shrink-0 ml-2 lg:ml-4"
                    :class="showPTZControls ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'"
                    @click="togglePTZControls"
                >
                    <span class="hidden lg:inline">🕹️ Camera Control</span>
                    <span class="lg:hidden">🕹️</span>
                </button>
                
                <!-- SWITCH CAMERA BUTTON - UPDATED WITH CONSISTENT SIZE -->
                <button 
                    v-if="!totalDurationTime && hostHasCamera2" 
                    class="h-[30px] lg:h-[35px] inline-flex items-center justify-center text-white rounded-lg focus:outline-none text-base lg:text-lg flex-shrink-0 px-1.5 min-w-[30px] lg:min-w-[35px] whitespace-nowrap"
                    :class="isWaitingForCameraSwitch ? 'bg-gray-400 cursor-wait' : 'bg-orange-400 hover:bg-orange-500'"
                    @click="toggleHostCamera"
                    :disabled="isWaitingForCameraSwitch"
                >
                    <span v-if="isWaitingForCameraSwitch">⏳</span>
                    <span v-else>🔄️🎦</span>
                </button>
                
                <!-- MIRROR CAMERA BUTTON - UPDATED SIZE -->
                <button 
                    v-if="!totalDurationTime" 
                    class="h-[30px] lg:h-[35px] inline-flex items-center justify-center text-white rounded-lg focus:outline-none text-base lg:text-lg flex-shrink-0 px-1.5 min-w-[30px] lg:min-w-[35px] whitespace-nowrap bg-purple-400 hover:bg-purple-500"
                    @click="toggleMirrorCamera"
                >
                    🔁🎦
                </button>
                
                <!-- ANNOTATION COLOR PICKER - UPDATED EMOJI FOR MOBILE -->
                <button 
                    v-if="!totalDurationTime" 
                    class="h-[30px] w-[30px] lg:h-[35px] lg:w-[35px] flex items-center justify-center text-white rounded-lg focus:outline-none text-lg lg:text-xl flex-shrink-0"
                    :class="annotationColor === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'"
                    @click="toggleAnnotationColor"
                >
                    <span class="hidden lg:inline">✒️</span>
                    <span class="lg:hidden">🖊️</span>
                </button>
                
                <!-- CAMERA ON/OFF BUTTON - FIXED WIDTH -->
                <button 
                    v-if="!totalDurationTime && onCall" 
                    class="h-[30px] lg:h-[35px] inline-flex items-center justify-center text-white rounded-lg focus:outline-none text-base lg:text-lg flex-shrink-0 px-1.5 min-w-[30px] lg:min-w-[35px]" 
                    :class="isCameraOff ? 'bg-gray-400 hover:bg-gray-500' : 'bg-blue-400 hover:bg-blue-500'" 
                    @click="toggleCamera" 
                    :title="isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'"
                >
                    <span class="whitespace-nowrap">{{ isCameraOff ? '📷❌' : '📷' }}</span>
                </button>
                
                <!-- MUTE/UNMUTE BUTTON - UPDATED EMOJI -->
                <button 
                    v-if="!totalDurationTime && onCall" 
                    class="h-[30px] w-[30px] lg:h-[35px] lg:w-[35px] flex items-center justify-center text-white rounded-lg focus:outline-none text-lg lg:text-xl flex-shrink-0" 
                    :class="isMuted ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-400 hover:bg-green-500'" 
                    @click="toggleMute" 
                    :title="isMuted ? 'Unmute' : 'Mute'"
                >
                    {{ isMuted ? '🔇' : '🎙️' }}
                </button>
                
                <!-- CLEAR ANNOTATION BUTTON - UPDATED SIZE -->
                <button 
                    v-if="showEraserLine" 
                    class="h-[30px] lg:h-[35px] inline-flex items-center justify-center text-white rounded-lg focus:outline-none text-base lg:text-lg flex-shrink-0 px-1.5 min-w-[30px] lg:min-w-[35px] whitespace-nowrap bg-orange-400 hover:bg-orange-500" 
                    @click="clearAnnotation"
                >
                    ❌🖊️
                </button>
                
                <!-- LEAVE CALL BUTTON - ADDED MARGIN LEFT FOR SPACING -->
                <button 
                    v-if="onCall" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs bg-red-400 text-white rounded-lg px-1.5 lg:px-2 py-1 hover:bg-red-500 focus:outline-none whitespace-nowrap ml-2 flex-shrink-0" 
                    @click="leaveCall"
                >
                    <span class="hidden lg:inline">❌ Leave call</span>
                    <span class="lg:hidden">❌</span>
                </button>
            </div>
        </div>

        <div v-if="totalDurationTime" class="flex flex-col items-center justify-center p-4 bg-gray-100 w-screen gap-4">
            <p class="text-center">You have <span class="text-blue-500 font-bold">left the call</span>. Total duration <span class="text-blue-500 font-bold">{{ totalDurationTime }}</span></p>
            <button 
                class="flex items-center justify-center text-sm bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none transition-colors"
                @click="goHome"
            >
                🏠 Go to Home
            </button>
        </div>
        
        <div v-else class="flex flex-col w-full h-full relative">

            <!-- PTZ Controls Sidebar - Floating Left -->
            <transition name="slide-fade">
                <div 
                    v-if="showPTZControls && !totalDurationTime"
                    class="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl p-2 lg:p-4 shadow-2xl"
                >
                    <div class="flex flex-col items-center gap-1 lg:gap-2">
                        <!-- Title -->
                        <p class="text-[9px] lg:text-xs font-semibold text-gray-700 mb-0.5 lg:mb-1">PTZ Control</p>
                        
                        <!-- Up Arrow -->
                        <button 
                            class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                            @mousedown="startPTZ('up')"
                            @mouseup="stopPTZ"
                            @mouseleave="stopPTZ"
                            @touchstart.prevent="startPTZ('up')"
                            @touchend.prevent="stopPTZ"
                            title="Pan Up"
                        >
                            ⬆️
                        </button>
                        
                        <!-- Left and Right Row (No Center Button) -->
                        <div class="flex gap-1 lg:gap-2">
                            <!-- Left Arrow -->
                            <button 
                                class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                @mousedown="startPTZ('left')"
                                @mouseup="stopPTZ"
                                @mouseleave="stopPTZ"
                                @touchstart.prevent="startPTZ('left')"
                                @touchend.prevent="stopPTZ"
                                title="Pan Left"
                            >
                                ⬅️
                            </button>
                            
                            <!-- Right Arrow -->
                            <button 
                                class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                @mousedown="startPTZ('right')"
                                @mouseup="stopPTZ"
                                @mouseleave="stopPTZ"
                                @touchstart.prevent="startPTZ('right')"
                                @touchend.prevent="stopPTZ"
                                title="Pan Right"
                            >
                                ➡️
                            </button>
                        </div>
                        
                        <!-- Down Arrow -->
                        <button 
                            class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                            @mousedown="startPTZ('down')"
                            @mouseup="stopPTZ"
                            @mouseleave="stopPTZ"
                            @touchstart.prevent="startPTZ('down')"
                            @touchend.prevent="stopPTZ"
                            title="Pan Down"
                        >
                            ⬇️
                        </button>
                        
                        <!-- Zoom Controls -->
                        <div class="flex gap-1 lg:gap-2 mt-1 lg:mt-2 pt-1 lg:pt-2 border-t border-gray-300">
                            <!-- Zoom In -->
                            <button 
                                class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                :class="currentZoom >= 3 ? 'opacity-50 cursor-not-allowed' : ''"
                                :disabled="currentZoom >= 3"
                                @click="zoomIn"
                                title="Zoom In"
                            >
                                ➕
                            </button>
                            
                            <!-- Zoom Out -->
                            <button 
                                class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                :class="currentZoom <= 1 ? 'opacity-50 cursor-not-allowed' : ''"
                                :disabled="currentZoom <= 1"
                                @click="zoomOut"
                                title="Zoom Out"
                            >
                                ➖
                            </button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Video Container -->
            <div class="relative w-full flex justify-center items-center flex-1 overflow-hidden p-1 lg:p-4">
                <div class="relative w-full max-w-[min(100vw,calc((100vh-140px)*16/9))] aspect-video max-h-[calc(100vh-140px)] overflow-hidden rounded-lg lg:rounded-xl bg-black
                            landscape-mobile:max-w-[calc(100vw-4px)] 
                            landscape-mobile:max-h-[calc(100vh-56px)] 
                            landscape-mobile:aspect-video
                            landscape-mobile:p-0">
                    <!-- Remote Video Stream - WITH MIRROR AND ZOOM (Content Only) -->
                    <video 
                        id="remote-stream" 
                        ref="remoteStream" 
                        autoplay 
                        playsinline 
                        :style="{ 
                            transform: `${currentMirrorState ? 'scaleX(-1)' : ''} scale(${currentZoom})`,
                            transformOrigin: 'center center'
                        }"
                        class="w-full h-full object-cover transition-transform duration-300"
                    ></video>

                    <!-- Canvas for Annotations - NO MIRROR on canvas itself -->
                    <canvas
                        ref="canvas"
                        class="absolute top-0 left-0 w-full h-full pointer-events-auto"
                        @mousedown="startDraw"
                        @mousemove="draw"
                        @mouseup="stopDraw"
                        @touchstart.prevent="startDrawTouch"
                        @touchmove.prevent="drawTouch"
                        @touchend="stopDraw"
                    />
                </div>
            </div>

            <!-- Participant's Camera Preview (small) - Bottom Left -->
            <div v-if="onCall" class="fixed bottom-4 left-4 w-32 lg:w-48 aspect-video z-10">
                <div 
                    ref="localStream" 
                    id="local-stream"
                    class="w-full h-full rounded-lg lg:rounded-xl bg-gray-800 border-2 border-white shadow-lg overflow-hidden"
                ></div>
                <p class="absolute bottom-1 left-1 text-[8px] lg:text-xs bg-black/60 text-white px-1 rounded">You</p>
            </div>
        </div>
    </div>
    </div>
</template>

<script setup lang="ts">
import { Timestamp, collection, onSnapshot, query, orderBy, getDocs, deleteDoc, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { useAgora } from '~/composable/agora';
import { getCoordinates } from '~/utils/canvasUtils';


const route = useRoute()
const roomID = ref(route.params.id as string ?? '')
const config = useRuntimeConfig()
const appID = ref(config.public.APP_ID)

const userUUID = ref('e1c4fbd9e3f1459aab16e5f1ffaf5475')
const canvas = ref<HTMLCanvasElement | null>(null)
const ctxCanvas = ref<CanvasRenderingContext2D | null>(null)
const remoteStream = ref<HTMLVideoElement | null>(null)
const localStream = ref<HTMLDivElement | null>(null)
const startTime = ref()
const totalDurationTime = ref<string | null>(null)
const onCall = ref(false)
const isDrawing = ref(false)
const showEraserLine = ref(false)
const lastX = ref<number | null>(null)
const lastY = ref<number | null>(null)
const lines: Ref<LineData[]> = ref([])
const isMuted = ref(false)
const isCameraOff = ref(false)
const roomDoesntExist = ref(false)
const annotationColor = ref('red')

const selectedCam = ref(1)
const hostHasCamera2 = ref(false)
const camera1Name = ref('Camera 1')
const camera2Name = ref('Camera 2')
const camera1Mirror = ref(true)
const camera2Mirror = ref(false)
const isWaitingForCameraSwitch = ref(false)

const currentCameraName = computed(() => {
    return selectedCam.value === 1 ? camera1Name.value : camera2Name.value
})

const currentMirrorState = computed(() => {
    return selectedCam.value === 1 ? camera1Mirror.value : camera2Mirror.value
})

const ptzActive = ref(false)
const ptzDirection = ref<string | null>(null)
const showPTZControls = ref(false)


const isFullscreen = ref(false)
const currentZoom = ref(1) // Zoom level: 1 = normal, max 3

const { $firestore } = useNuxtApp()
const { client, joinChannel, localVideoTrack, localAudioTrack, leaveChannel } = useAgora(appID.value, roomID.value, userUUID.value)

interface LineData {
    startX: number
    startY: number
    endX: number
    endY: number
    role: number
    color: string
    timestamp: Timestamp
}

onMounted(async () => {
    await checkIfRoomExist()
    if (!roomDoesntExist.value) {
        await loadCameraStates()
        join()
        document.body.classList.add('overflow-hidden')
        listenUserPublish()
        listenToCameraStatesChanges()
        
        nextTick(() => {
            if (remoteStream.value) {
                remoteStream.value.onloadeddata = () => {
                    setCanvasSize()
                    listenToDrawingUpdates()
                }
            }
            window.addEventListener('resize', () => {
                setCanvasSize()
                drawLineOnCanvas()
            })
        })
        
        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.addEventListener('mozfullscreenchange', handleFullscreenChange)
        document.addEventListener('msfullscreenchange', handleFullscreenChange)
    }
})

onBeforeUnmount(() => {
    clearSession()
    
    // Remove fullscreen listeners
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    document.removeEventListener('msfullscreenchange', handleFullscreenChange)
})

const loadCameraStates = async () => {
    try {
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        const docSnap = await getDoc(roomMetaDoc)
        
        if (docSnap.exists()) {
            const data = docSnap.data()
            selectedCam.value = data.selectedCam || 1
            camera1Name.value = data.camera1Name || 'Camera 1'
            camera2Name.value = data.camera2Name || 'Camera 2'
            camera1Mirror.value = data.camera1Mirror ?? true
            camera2Mirror.value = data.camera2Mirror ?? false
            hostHasCamera2.value = !!data.camera2
            
            console.log('✅ Loaded camera states:', {
                selectedCam: selectedCam.value,
                camera1Name: camera1Name.value,
                camera2Name: camera2Name.value,
                camera1Mirror: camera1Mirror.value,
                camera2Mirror: camera2Mirror.value,
                hostHasCamera2: hostHasCamera2.value
            })
        }
    } catch (err) {
        console.error('❌ Error loading camera states:', err)
    }
}

const listenToCameraStatesChanges = () => {
    const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
    
    onSnapshot(roomMetaDoc, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data()
            const newSelectedCam = data.selectedCam || 1
            
            // Check if camera actually switched
            if (newSelectedCam !== selectedCam.value) {
                console.log(`📷 Camera switched from ${selectedCam.value} to ${newSelectedCam}`)
                isWaitingForCameraSwitch.value = false
            }
            
            selectedCam.value = newSelectedCam
            camera1Name.value = data.camera1Name || 'Camera 1'
            camera2Name.value = data.camera2Name || 'Camera 2'
            camera1Mirror.value = data.camera1Mirror ?? true
            camera2Mirror.value = data.camera2Mirror ?? false
            hostHasCamera2.value = !!data.camera2
            
            // Redraw canvas after mirror state changes
            setTimeout(() => {
                drawLineOnCanvas()
            }, 100)
        }
    })
}

const toggleHostCamera = async () => {
    if (isWaitingForCameraSwitch.value) return
    
    try {
        isWaitingForCameraSwitch.value = true
        const newCam = selectedCam.value === 1 ? 2 : 1
        
        console.log(`🔄 Requesting camera switch to camera ${newCam}`)
        
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        await setDoc(roomMetaDoc, {
            selectedCam: newCam,
            updatedAt: Timestamp.now()
        }, { merge: true })
        
        // Set timeout to reset waiting state if no response
        setTimeout(() => {
            if (isWaitingForCameraSwitch.value) {
                console.warn('⚠️ Camera switch timeout - resetting waiting state')
                isWaitingForCameraSwitch.value = false
            }
        }, 5000)
        
    } catch (err) {
        console.error('❌ Error switching camera:', err)
        isWaitingForCameraSwitch.value = false
    }
}

const toggleMirrorCamera = async () => {
    try {
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        
        if (selectedCam.value === 1) {
            camera1Mirror.value = !camera1Mirror.value
            await setDoc(roomMetaDoc, {
                camera1Mirror: camera1Mirror.value,
                updatedAt: Timestamp.now()
            }, { merge: true })
            console.log(`🪞 Camera 1 mirror: ${camera1Mirror.value}`)
        } else {
            camera2Mirror.value = !camera2Mirror.value
            await setDoc(roomMetaDoc, {
                camera2Mirror: camera2Mirror.value,
                updatedAt: Timestamp.now()
            }, { merge: true })
            console.log(`🪞 Camera 2 mirror: ${camera2Mirror.value}`)
        }
        
        // Redraw canvas after mirror change
        setTimeout(() => {
            drawLineOnCanvas()
        }, 100)
        
    } catch (err) {
        console.error('❌ Error toggling mirror:', err)
    }
}

const toggleAnnotationColor = () => {
    annotationColor.value = annotationColor.value === 'red' ? 'blue' : 'red'
    console.log(`🖍️ Annotation color: ${annotationColor.value}`)
}

const checkIfRoomExist = async () => {
    try {
        const roomCollection = collection(firestore.value, roomID.value)
        const snapshot = await getDocs(roomCollection)
        
        if (snapshot.empty) {
            console.log('❌ Room does not exist')
            roomDoesntExist.value = true
        } else {
            console.log('✅ Room exists')
            roomDoesntExist.value = false
        }
    } catch (err) {
        console.error('Error checking room existence:', err)
        roomDoesntExist.value = true
    }
}

const toggleMute = async () => {
    if (localAudioTrack.value) {
        await localAudioTrack.value.setEnabled(isMuted.value)
        isMuted.value = !isMuted.value
    }
}

const toggleCamera = async () => {
    if (localVideoTrack.value) {
        await localVideoTrack.value.setEnabled(isCameraOff.value)
        isCameraOff.value = !isCameraOff.value
        console.log(`📷 Camera ${isCameraOff.value ? 'OFF' : 'ON'}`)
    }
}

const zoomIn = () => {
    if (currentZoom.value < 3) {
        currentZoom.value = Math.min(currentZoom.value + 0.25, 3)
        console.log(`🔍➕ Zoom In: ${currentZoom.value}x`)
    }
}

const zoomOut = () => {
    if (currentZoom.value > 1) {
        currentZoom.value = Math.max(currentZoom.value - 0.25, 1)
        console.log(`🔍➖ Zoom Out: ${currentZoom.value}x`)
    }
}

const leaveCall = async () => {
    const duration = Date.now() - startTime.value
    totalDurationTime.value = millisToMinutesAndSeconds(duration)
    onCall.value = false
    
    // Stop local tracks before leaving
    try {
        if (localVideoTrack.value) {
            localVideoTrack.value.stop()
            localVideoTrack.value.close()
            console.log('📷 Local video track stopped')
        }
        if (localAudioTrack.value) {
            localAudioTrack.value.stop()
            localAudioTrack.value.close()
            console.log('🎙️ Local audio track stopped')
        }
    } catch (err) {
        console.error('❌ Error stopping tracks:', err)
    }
    
    leaveChannel()
    console.log('👋 Participant left the call')
}

const goHome = () => {
    // Navigate to home page
    navigateTo('/')
}

const millisToMinutesAndSeconds = (millis: number) => {
    const minutes = Math.floor(millis / 60000)
    const seconds = parseInt(((millis % 60000) / 1000).toFixed(0))
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const clearSession = () => {
    leaveChannel()
    document.body.classList.remove('overflow-hidden')
}

const clearAnnotation = async () => {
    try {
        const linesCollection = collection(firestore.value, roomID.value)
        const snapshot = await getDocs(linesCollection)
        
        snapshot.docs.forEach(async (document) => {
            // Don't delete the _init document
            if (document.id !== '_init') {
                await deleteDoc(doc(firestore.value, roomID.value, document.id))
            }
        })
        
        lines.value = []
        showEraserLine.value = false
        console.log('✅ All annotations cleared')
    } catch (err) {
        console.error('Error clearing annotations', err)
    }
}

const firestore = computed(() => {
    return $firestore as Firestore
})

const join = async () => {
    startTime.value = Date.now()
    onCall.value = true
    
    try {
        // Join channel and publish video/audio (NOT view-only, participant needs camera!)
        const res = await joinChannel()
        
        // Display local video in preview using Agora track
        const localElement = localStream.value
        if (localElement && res?.localVideoTrack.value) {
            res.localVideoTrack.value.play(localElement)
            console.log('📹 Local video preview started')
        }
    } catch (err) {
        console.error('❌ Error joining channel or accessing camera:', err)
        alert('Cannot access camera/microphone. Please allow permissions and try again.')
    }
}

const listenToDrawingUpdates = async () => {
    const linesCollection = collection(firestore.value, roomID.value)
    const q = query(linesCollection, orderBy('timestamp'))
    onSnapshot(q, (snapshot) => {
        // Filter out _init doc from lines
        const annotationDocs = snapshot.docs.filter(doc => doc.id !== '_init')
        showEraserLine.value = annotationDocs.length > 0
        lines.value = annotationDocs.map(doc => doc.data() as LineData)
        drawLineOnCanvas()
    })
}

const setCanvasSize = () => {
    if (!canvas.value) return
    ctxCanvas.value = canvas.value.getContext('2d')
    if (ctxCanvas.value) {
        const video = remoteStream.value
        const displayedWidth = video?.clientWidth || 0
        const displayedHeight = video?.clientHeight || 0
        canvas.value.width = displayedWidth
        canvas.value.height = displayedHeight
        ctxCanvas.value.lineWidth = 2
    }
}

const drawLineOnCanvas = () => {
    if (!ctxCanvas.value || !canvas.value) return
    
    ctxCanvas.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    
    // Save current context state
    ctxCanvas.value.save()
    
    // If mirrored, flip the canvas context for drawing
    if (currentMirrorState.value) {
        ctxCanvas.value.translate(canvas.value.width, 0)
        ctxCanvas.value.scale(-1, 1)
    }
    
    lines.value.forEach(lineData => {
        if (ctxCanvas.value && canvas.value) {
            const width = canvas.value.width
            const height = canvas.value.height
            
            ctxCanvas.value.strokeStyle = lineData.color || (lineData.role === 1 ? 'blue' : 'red')
            ctxCanvas.value.beginPath()
            ctxCanvas.value.moveTo(lineData.startX * width, lineData.startY * height)
            ctxCanvas.value.lineTo(lineData.endX * width, lineData.endY * height)
            ctxCanvas.value.stroke()
        }
    })
    
    // Restore context state
    ctxCanvas.value.restore()
}

const listenUserPublish = async () => {
    client.value.on('user-published', async (user: { uid: any; videoTrack: any; audioTrack: any }, mediaType: string) => {
        console.log('👤 User published:', user.uid, 'Media type:', mediaType)
        
        // Skip if it's our own user
        if (user.uid === userUUID.value) {
            console.log('⏭️ Skipping own user')
            return
        }
        
        if (mediaType === 'video') {
            console.log('📹 Subscribing to video stream...')
            await client.value.subscribe(user, 'video')
            const remoteVideoTrack = user.videoTrack
            const remoteElement = document.getElementById('remote-stream')
            
            if (remoteElement && remoteVideoTrack) {
                console.log('✅ Playing remote video stream')
                remoteVideoTrack.play(remoteElement)
            } else {
                console.error('❌ Remote element or video track not found')
            }
        } else if (mediaType === 'audio') {
            console.log('🎤 Subscribing to audio stream...')
            await client.value.subscribe(user, 'audio')
            user.audioTrack.play()
            console.log('✅ Playing remote audio stream')
        }
    })

    client.value.on('user-unpublished', (user: any, mediaType: string) => {
        console.log('User unpublished:', user.uid, 'Media type:', mediaType)
        if (mediaType === 'video') {
            console.log('⏳ Video unpublished - possibly switching...')
        }
    })

    client.value.on('user-left', (user: any) => {
        console.log('User left:', user.uid)
    })
}

// Helper function to adjust coordinates when mirrored
const adjustCoordinatesForMirror = (x: number, y: number): { x: number, y: number } => {
    if (currentMirrorState.value && canvas.value) {
        // When mirrored, flip the x coordinate
        return { x: 1 - x, y }
    }
    return { x, y }
}

const startDraw = (event: MouseEvent) => {
    isDrawing.value = true
    const coords = getCoordinates(event, canvas.value)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const draw = (event: MouseEvent) => {
    if (!isDrawing.value || !ctxCanvas.value) return
    const coords = getCoordinates(event, canvas.value)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    
    const lineData: LineData = { 
        startX: lastX.value!, 
        startY: lastY.value!, 
        endX: adjusted.x, 
        endY: adjusted.y, 
        role: 2,
        color: annotationColor.value,
        timestamp: Timestamp.now()
    }
    lines.value.push(lineData)

    saveLineDataToFirestore(lineData)
    drawLineOnCanvas()
  
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const stopDraw = () => {
    isDrawing.value = false
}

const startDrawTouch = (event: TouchEvent) => {
    isDrawing.value = true
    const coords = getCoordinates(event, canvas.value, true)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const drawTouch = (event: TouchEvent) => {
    if (!isDrawing.value || !ctxCanvas.value) return

    const coords = getCoordinates(event, canvas.value, true)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    
    const lineData: LineData = { 
        startX: lastX.value!, 
        startY: lastY.value!, 
        endX: adjusted.x, 
        endY: adjusted.y, 
        role: 2,
        color: annotationColor.value,
        timestamp: Timestamp.now()
    }
    lines.value.push(lineData)

    saveLineDataToFirestore(lineData)
    drawLineOnCanvas()
  
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const saveLineDataToFirestore = async (lineData: LineData) => {
    try {
      const linesCollection = collection(firestore.value, roomID.value)
      await addDoc(linesCollection, lineData)
    } catch (err) {
      console.error('Error saving line data to Firestore', err)
    }
}

// PTZ Control Functions - UPDATED WITH FIRESTORE
const togglePTZControls = () => {
    showPTZControls.value = !showPTZControls.value
    console.log(`🕹️ PTZ Controls ${showPTZControls.value ? 'shown' : 'hidden'}`)
}

const startPTZ = async (direction: string) => {
    ptzActive.value = true
    ptzDirection.value = direction
    console.log(`🎮 PTZ Control Started: ${direction}`)
    
    try {
        // Simpan command ke Firestore
        const ptzCommandsCollection = collection(firestore.value, 'ptz-commands')
        await addDoc(ptzCommandsCollection, {
            command: direction,
            roomID: roomID.value,
            timestamp: Timestamp.now(),
            status: 'pending'
        })
        console.log(`✅ PTZ command '${direction}' sent to Firestore`)
    } catch (err) {
        console.error('❌ Error sending PTZ command:', err)
    }
}

const stopPTZ = async () => {
    if (ptzActive.value) {
        console.log(`🎮 PTZ Control Stopped: ${ptzDirection.value}`)
        
        try {
            // Kirim command 'stop' ke Firestore
            const ptzCommandsCollection = collection(firestore.value, 'ptz-commands')
            await addDoc(ptzCommandsCollection, {
                command: 'stop',
                roomID: roomID.value,
                timestamp: Timestamp.now(),
                status: 'pending'
            })
            console.log(`✅ PTZ stop command sent to Firestore`)
        } catch (err) {
            console.error('❌ Error sending PTZ stop command:', err)
        }
        
        ptzActive.value = false
        ptzDirection.value = null
    }
}

const resetPTZ = async () => {
    console.log('🎯 PTZ Reset to Home Position')
    
    try {
        // Kirim command 'reset' atau 'home' ke Firestore
        const ptzCommandsCollection = collection(firestore.value, 'ptz-commands')
        await addDoc(ptzCommandsCollection, {
            command: 'reset',
            roomID: roomID.value,
            timestamp: Timestamp.now(),
            status: 'pending'
        })
        console.log(`✅ PTZ reset command sent to Firestore`)
    } catch (err) {
        console.error('❌ Error sending PTZ reset command:', err)
    }
}

// Fullscreen Functions
const toggleFullscreen = async () => {
    try {
        const elem = document.documentElement as any // Type cast untuk support vendor prefixes
        
        if (!isFullscreen.value) {
            // Enter fullscreen
            if (elem.requestFullscreen) {
                await elem.requestFullscreen()
            } else if (elem.webkitRequestFullscreen) { // Safari
                await elem.webkitRequestFullscreen()
            } else if (elem.mozRequestFullScreen) { // Firefox
                await elem.mozRequestFullScreen()
            } else if (elem.msRequestFullscreen) { // IE11
                await elem.msRequestFullscreen()
            }
            console.log('📱 Entered fullscreen mode')
        } else {
            // Exit fullscreen
            const doc = document as any // Type cast untuk support vendor prefixes
            if (doc.exitFullscreen) {
                await doc.exitFullscreen()
            } else if (doc.webkitExitFullscreen) {
                await doc.webkitExitFullscreen()
            } else if (doc.mozCancelFullScreen) {
                await doc.mozCancelFullScreen()
            } else if (doc.msExitFullscreen) {
                await doc.msExitFullscreen()
            }
            console.log('📱 Exited fullscreen mode')
        }
    } catch (err) {
        console.error('❌ Error toggling fullscreen:', err)
    }
}

const handleFullscreenChange = () => {
    const doc = document as any // Type cast untuk support vendor prefixes
    isFullscreen.value = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
    )
    console.log('📱 Fullscreen state:', isFullscreen.value)
    
    // Recalculate canvas size when fullscreen changes
    setTimeout(() => {
        setCanvasSize()
        drawLineOnCanvas()
    }, 100)
}
</script>

<style scoped>
/* Transition for PTZ Controls */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(-100%) translateY(-50%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-100%) translateY(-50%);
  opacity: 0;
}

/* Landscape Mobile Optimization - Only for small screens in landscape */
@media only screen and (max-width: 768px) and (max-height: 500px) and (orientation: landscape) {
  .landscape-mobile\:max-w-\[calc\(100vw-4px\)\] {
    max-width: calc(100vw - 4px);
  }
  
  .landscape-mobile\:max-h-\[calc\(100vh-56px\)\] {
    max-height: calc(100vh - 56px);
  }
  
  .landscape-mobile\:aspect-video {
    aspect-ratio: 16 / 9;
  }
  
  .landscape-mobile\:p-0 {
    padding: 0;
  }
}
</style>