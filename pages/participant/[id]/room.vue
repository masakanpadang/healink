<template>
    <div class="flex w-full min-h-screen overflow-hidden">

    <div v-if="roomDoesntExist" class="flex p-4 bg-gray-100 w-screen justify-center">
        <p>Sorry the room doesnt exist. Contact the host to create new room</p>
    </div>
    <div v-else class="flex flex-col w-full h-screen items-center overflow-hidden">
        <div class="flex w-full bg-[#3b62f0] p-2 lg:p-4 text-white w-full items-center">
            <div class="flex flex-col flex-1 min-w-0">
                <p class="text-[10px] lg:text-xs">Room's ID</p>
                <p class="font-bold text-sm lg:text-xl truncate">{{ roomID }}</p>
            </div>
            <div class="flex flex-wrap gap-1 lg:gap-2">
                <!-- FULLSCREEN BUTTON -->
                <button 
                    v-if="!totalDurationTime"
                    class="h-[30px] w-[30px] lg:h-[35px] lg:w-[35px] flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg focus:outline-none text-base lg:text-lg"
                    @click="toggleFullscreen"
                    :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
                >
                    {{ isFullscreen ? '⛶' : '⛶' }}
                </button>
                
                <!-- SWITCH CAMERA BUTTON -->
                <button 
                    v-if="!totalDurationTime && hostHasCamera2" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs text-white rounded-lg px-1.5 lg:px-2 py-1 focus:outline-none whitespace-nowrap"
                    :class="isWaitingForCameraSwitch ? 'bg-gray-400 cursor-wait' : 'bg-orange-400 hover:bg-orange-500'"
                    @click="toggleHostCamera"
                    :disabled="isWaitingForCameraSwitch"
                >
                    <span v-if="isWaitingForCameraSwitch" class="hidden lg:inline">⏳ Switching...</span>
                    <span v-if="isWaitingForCameraSwitch" class="lg:hidden">⏳</span>
                    <span v-else class="hidden lg:inline">{{ selectedCam === 1 ? 'Switch to Cam 2' : 'Switch to Cam 1' }}</span>
                    <span v-else class="lg:hidden">📷{{ selectedCam === 1 ? '2' : '1' }}</span>
                </button>
                
                <!-- MIRROR CAMERA BUTTON -->
                <button 
                    v-if="!totalDurationTime" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs bg-purple-400 text-white rounded-lg px-1.5 lg:px-2 py-1 hover:bg-purple-500 focus:outline-none whitespace-nowrap"
                    @click="toggleMirrorCamera"
                >
                    <span class="hidden lg:inline">{{ currentMirrorState ? '🪞 Unmirror' : '🪞 Mirror' }}</span>
                    <span class="lg:hidden">🪞</span>
                </button>
                
                <!-- ANNOTATION COLOR PICKER -->
                <button 
                    v-if="!totalDurationTime" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs text-white rounded-lg px-1.5 lg:px-2 py-1 focus:outline-none whitespace-nowrap"
                    :class="annotationColor === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'"
                    @click="toggleAnnotationColor"
                >
                    <span class="hidden lg:inline">🖍️ {{ annotationColor === 'red' ? 'Red' : 'Blue' }}</span>
                    <span class="lg:hidden">🖍️</span>
                </button>
                
                <!-- MUTE/UNMUTE BUTTON WITH EMOJI -->
                <button v-if="!totalDurationTime && onCall" class="h-[30px] w-[30px] lg:h-[35px] lg:w-[35px] flex items-center justify-center text-white rounded-lg focus:outline-none text-lg lg:text-xl" :class="isMuted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-400 hover:bg-green-500'" @click="toggleMute" :title="isMuted ? 'Unmute' : 'Mute'">
                    {{ isMuted ? '🔇' : '🎤' }}
                </button>
                
                <button 
                    v-if="showEraserLine" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs bg-orange-400 text-white rounded-lg px-1.5 lg:px-2 py-1 hover:bg-orange-500 focus:outline-none whitespace-nowrap" 
                    @click="clearAnnotation"
                >
                    <span class="hidden lg:inline">Clear Annotation</span>
                    <span class="lg:hidden">🗑️</span>
                </button>
                <button 
                    v-if="onCall" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs bg-red-400 text-white rounded-lg px-1.5 lg:px-2 py-1 hover:bg-red-500 focus:outline-none whitespace-nowrap" 
                    @click="endCall"
                >
                    <span class="hidden lg:inline">End call</span>
                    <span class="lg:hidden">❌</span>
                </button>
            </div>
        </div>

        <div v-if="totalDurationTime" class="flex p-4 bg-gray-100 w-screen justify-center">
            <p>The call has <span class="text-red-400 font-bold">ended</span>. Total duration <span class="text-red-400 font-bold">{{ totalDurationTime }}</span></p>
        </div>
        
        <div v-else class="flex flex-col w-full h-full">
            <!-- Camera Info Banner -->
            <div v-if="hostHasCamera2" class="flex justify-center p-1 lg:p-2 bg-blue-50 flex-shrink-0">
                <p class="text-[10px] lg:text-sm text-gray-700">
                    🎥 <span class="font-bold">{{ currentCameraName }}</span>
                    <span class="text-[9px] lg:text-xs text-gray-500 ml-1 lg:ml-2">({{ currentMirrorState ? 'Mirrored' : 'Normal' }})</span>
                </p>
            </div>

            <!-- Video Container -->
            <div class="relative w-full flex justify-center items-center p-1 lg:p-4 flex-1 overflow-hidden">
                <div class="relative w-full max-w-[min(100vw,calc((100vh-140px)*16/9))] aspect-video">
                    <!-- Remote Video Stream - WITH MIRROR -->
                    <video 
                        id="remote-stream" 
                        ref="remoteStream" 
                        autoplay 
                        playsinline 
                        :class="['w-full h-full object-contain rounded-lg lg:rounded-xl bg-black', currentMirrorState ? 'scale-x-[-1]' : '']"
                    ></video>

                    <!-- Canvas for Annotations - NO MIRROR on canvas itself -->
                    <canvas
                        ref="canvas"
                        class="absolute top-0 left-0 w-full h-full"
                        @mousedown="startDraw"
                        @mousemove="draw"
                        @mouseup="stopDraw"
                        @touchstart.prevent="startDrawTouch"
                        @touchmove.prevent="drawTouch"
                        @touchend="stopDraw"
                    />

                    <!-- PTZ Controls Overlay - Optimized for landscape -->
                    <div class="absolute bottom-2 left-2 lg:bottom-4 lg:left-4 bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl p-2 lg:p-4 shadow-lg">
                        <div class="flex flex-col items-center gap-1 lg:gap-2">
                            <!-- Title -->
                            <p class="text-[9px] lg:text-xs font-semibold text-gray-700 mb-0.5 lg:mb-1">PTZ</p>
                            
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
                            
                            <!-- Left, Center, Right Row -->
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
                                
                                <!-- Center/Home Button -->
                                <button 
                                    class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded-lg text-sm lg:text-xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                    @click="resetPTZ"
                                    title="Reset to Home Position"
                                >
                                    🎯
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
                            <div class="flex gap-1 lg:gap-2 mt-1 lg:mt-2">
                                <button 
                                    class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                    @mousedown="startPTZ('zoomIn')"
                                    @mouseup="stopPTZ"
                                    @mouseleave="stopPTZ"
                                    @touchstart.prevent="startPTZ('zoomIn')"
                                    @touchend.prevent="stopPTZ"
                                    title="Zoom In"
                                >
                                    ➕
                                </button>
                                <button 
                                    class="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg text-base lg:text-2xl transition-all duration-150 shadow-md hover:shadow-lg touch-manipulation"
                                    @mousedown="startPTZ('zoomOut')"
                                    @mouseup="stopPTZ"
                                    @mouseleave="stopPTZ"
                                    @touchstart.prevent="startPTZ('zoomOut')"
                                    @touchend.prevent="stopPTZ"
                                    title="Zoom Out"
                                >
                                    ➖
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
</template>

<script setup lang="ts">
import { Timestamp, collection, onSnapshot, query, orderBy, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { useAgora } from '~/composable/agora';
import { getCoordinates } from '~/utils/canvasUtils';
import { addDoc } from 'firebase/firestore';

const route = useRoute()
const roomID = ref(route.params.id as string ?? '')
const config = useRuntimeConfig()
const appID = ref(config.public.APP_ID)

const userUUID = ref('e1c4fbd9e3f1459aab16e5f1ffaf5475')
const canvas = ref<HTMLCanvasElement | null>(null)
const ctxCanvas = ref<CanvasRenderingContext2D | null>(null)
const remoteStream = ref<HTMLVideoElement | null>(null)
const startTime = ref()
const totalDurationTime = ref<string | null>(null)
const onCall = ref(false)
const isDrawing = ref(false)
const showEraserLine = ref(false)
const lastX = ref<number | null>(null)
const lastY = ref<number | null>(null)
const lines: Ref<LineData[]> = ref([])
const isMuted = ref(false)
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

const isFullscreen = ref(false)

const { $firestore } = useNuxtApp()
const { client, joinChannel, localAudioTrack, leaveChannel } = useAgora(appID.value, roomID.value, userUUID.value)

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

const endCall = () => {
    const duration = Date.now() - startTime.value
    totalDurationTime.value = millisToMinutesAndSeconds(duration)
    onCall.value = false
    leaveChannel()
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
    await joinChannel()
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

// PTZ Control Functions
const startPTZ = (direction: string) => {
    ptzActive.value = true
    ptzDirection.value = direction
    console.log(`🎮 PTZ Control Started: ${direction}`)
    
    // TODO: Implement PTZ control logic
    // This will be connected to backend in next step
}

const stopPTZ = () => {
    if (ptzActive.value) {
        console.log(`🎮 PTZ Control Stopped: ${ptzDirection.value}`)
        ptzActive.value = false
        ptzDirection.value = null
        
        // TODO: Implement stop PTZ logic
    }
}

const resetPTZ = () => {
    console.log('🎯 PTZ Reset to Home Position')
    
    // TODO: Implement reset PTZ to home position
}

// Fullscreen Functions
const toggleFullscreen = async () => {
    try {
        const elem = document.documentElement
        
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
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen()
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen()
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen()
            }
            console.log('📱 Exited fullscreen mode')
        }
    } catch (err) {
        console.error('❌ Error toggling fullscreen:', err)
    }
}

const handleFullscreenChange = () => {
    isFullscreen.value = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    )
    console.log('📱 Fullscreen state:', isFullscreen.value)
    
    // Recalculate canvas size when fullscreen changes
    setTimeout(() => {
        setCanvasSize()
        drawLineOnCanvas()
    }, 100)
}
</script>