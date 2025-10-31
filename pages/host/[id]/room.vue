<template>
    <div class="flex w-full h-screen overflow-hidden">
      <div class="flex flex-col w-full h-full">
        <div class="flex w-full bg-[#3b62f0] p-2 lg:p-4 text-white w-full items-center">
            <div class="flex flex-col flex-1 min-w-0">
                <p class="text-[10px] lg:text-xs">Room's ID</p>
                <div class="flex items-center gap-2">
                    <p class="font-bold text-sm lg:text-xl truncate">{{ roomID }}</p>
                    <span 
                        class="text-[9px] lg:text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                        :class="hasRemoteVideo ? 'bg-green-400 text-white' : 'bg-gray-400 text-white'"
                    >
                        {{ hasRemoteVideo ? '✓ Proctor Connected' : '○ Waiting for Proctor' }}
                    </span>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-1 lg:gap-2">
                <!-- <button 
                    v-if="!totalDurationTime" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs text-white rounded-lg px-1.5 lg:px-2 py-1 focus:outline-none whitespace-nowrap bg-orange-400 hover:bg-orange-500" 
                    @click="switchCameraInternal"
                >
                    <span class="hidden lg:inline">Switch Camera</span>
                    <span class="lg:hidden">📷1</span>
                </button> -->
                <button 
                    v-if="!totalDurationTime && availableCameras.length > 1" 
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs text-white rounded-lg px-1.5 lg:px-2 py-1 focus:outline-none whitespace-nowrap bg-teal-400 hover:bg-teal-500" 
                    @click="switchCamera2Internal"
                >
                    <span class="hidden lg:inline">Switch Preview Cam</span>
                    <span class="lg:hidden">📷P</span>
                </button>
                <button 
                    v-if="!totalDurationTime && onCall" 
                    class="h-[30px] w-[30px] lg:h-[35px] lg:w-[35px] flex items-center justify-center text-white rounded-lg focus:outline-none text-lg lg:text-xl" 
                    :class="isMuted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-400 hover:bg-green-500'" 
                    @click="toggleMute" 
                    :title="isMuted ? 'Unmute' : 'Mute'"
                >
                    {{ isMuted ? '🔇' : '🎙️' }}
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
                    class="h-[30px] lg:h-[35px] flex items-center justify-center text-[10px] lg:text-xs bg-red-400 text-white rounded-lg px-1.5 lg:px-2 py-1 hover:bg-red-500 focus:outline-none whitespace-nowrap ml-2" 
                    @click="endCall"
                >
                    <span class="hidden lg:inline">End Call</span>
                    <span class="lg:hidden">❌</span>
                </button>
            </div>
        </div>

        <div v-if="totalDurationTime" class="flex flex-col p-4 bg-gray-100 w-full justify-center items-center gap-4">
            <p>The call has <span class="text-red-400 font-bold">ended</span>. Total duration <span class="text-red-400 font-bold">{{ totalDurationTime }}</span></p>
            <button 
                class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                @click="goToHome"
            >
                Back to Home
            </button>
        </div>
        
        <div v-else class="flex flex-col w-full h-full">
            <div class="relative w-full flex justify-center items-center p-2 lg:p-4 flex-1 overflow-hidden">
                <div class="relative w-full max-w-[min(100vw,calc((100vh-140px)*16/9))] aspect-video">
                    <!-- Main video - TANPA BLACK BAR -->
                    <video 
                        ref="mainVideo" 
                        autoplay 
                        playsinline 
                        :class="['w-full h-full object-cover rounded-xl', currentMirrorState ? 'scale-x-[-1]' : '']"
                    ></video>
                    
                    <!-- Canvas for annotations -->
                    <canvas 
                        ref="canvas" 
                        class="absolute top-0 left-0 w-full h-full"
                        @mousedown="startDraw" 
                        @mousemove="draw" 
                        @mouseup="stopDraw" 
                        @touchstart.prevent="startDrawTouch" 
                        @touchmove.prevent="drawTouch" 
                        @touchend="stopDraw"
                    ></canvas>
                </div>
            </div>

            <!-- Preview Camera (small) - POSISI KANAN BAWAH -->
            <div v-if="availableCameras.length > 1" class="fixed bottom-4 right-4 w-32 lg:w-48 aspect-video z-10">
                <video 
                    ref="previewVideo"
                    autoplay 
                    playsinline 
                    :class="['w-full h-full object-cover rounded-xl bg-black border-2 border-white shadow-lg', previewMirrorState ? 'scale-x-[-1]' : '']"
                ></video>
            </div>

            <!-- Preview Participant Camera (small) - POSISI KIRI BAWAH -->
            <div v-if="hasRemoteVideo" class="fixed bottom-4 left-4 w-32 lg:w-48 aspect-video z-10">
                <div 
                    id="remote-stream" 
                    class="w-full h-full rounded-xl bg-gray-800 border-2 border-white shadow-lg overflow-hidden"
                ></div>
                <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">
                    Proctor
                </div>
            </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { Timestamp, collection, onSnapshot, query, orderBy, getDocs, deleteDoc, doc, addDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { useAgora } from '~/composable/agora';
import { getCoordinates } from '~/utils/canvasUtils';

const route = useRoute()
const router = useRouter()
const roomID = ref(route.params.id as string ?? '')
const config = useRuntimeConfig()
const appID = ref(config.public.APP_ID)

const userUUID = ref('e1c4fbd9e3f1459aab16e5f1ffaf5474')
const canvas = ref<HTMLCanvasElement | null>(null)
const ctxCanvas = ref<CanvasRenderingContext2D | null>(null)
const mainVideo = ref<HTMLVideoElement | null>(null)
const previewVideo = ref<HTMLVideoElement | null>(null)
const camera1Stream = ref<MediaStream | null>(null)
const camera2Stream = ref<MediaStream | null>(null)
const startTime = ref()
const totalDurationTime = ref<string | null>(null)
const onCall = ref(false)
const isDrawing = ref(false)
const showEraserLine = ref(false)
const lastX = ref<number | null>(null)
const lastY = ref<number | null>(null)
const availableCameras = ref<MediaDeviceInfo[]>([])
const selectedCameraId = ref<string | null>(null)
const selectedCamera2Id = ref<string | null>(null)
const lines: Ref<LineData[]> = ref([])
const isMuted = ref(false)

const camera1Name = ref('Camera 1')
const camera2Name = ref('Camera 2')
const hasRemoteVideo = ref(false)

const selectedCam = ref(1)
const isSwitchingCamera = ref(false)

const camera1Mirror = ref(false)
const camera2Mirror = ref(false)

const currentMirrorState = computed(() => {
    return selectedCam.value === 1 ? camera1Mirror.value : camera2Mirror.value
})

const previewMirrorState = computed(() => {
    return selectedCam.value === 1 ? camera2Mirror.value : camera1Mirror.value
})

// Watch for camera changes to update canvas and swap video streams
watch(selectedCam, () => {
    console.log('📹 Selected camera changed to:', selectedCam.value)
    swapVideoStreams()
    nextTick(() => {
        setCanvasSize()
        drawLineOnCanvas()
    })
})

// Watch hasRemoteVideo changes
watch(hasRemoteVideo, (newValue) => {
    console.log('👁️ hasRemoteVideo changed to:', newValue)
})

const { $firestore } = useNuxtApp()
const { client, joinChannel, localVideoTrack, localAudioTrack, leaveChannel, switchCamera } = useAgora(appID.value, roomID.value, userUUID.value)

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
    console.log('🚀 Host page mounted')
    
    await getAvailableCameras();
    if (availableCameras.value.length > 0) {
        selectedCameraId.value = availableCameras.value[0].deviceId
        camera1Name.value = availableCameras.value[0].label || 'Camera 1'
        await startCamera(selectedCameraId.value)
        
        if (availableCameras.value.length > 1) {
            selectedCamera2Id.value = availableCameras.value[1].deviceId
            camera2Name.value = availableCameras.value[1].label || 'Camera 2'
            await startCamera2(selectedCamera2Id.value)
        }
    }
    
    await initializeCameraStates()
    await initializeRoom()
    
    // Start listening to drawing updates IMMEDIATELY
    console.log('👂 Starting to listen to drawing updates...')
    listenToDrawingUpdates()
    
    console.log('📞 Joining channel...')
    join()

    document.body.classList.add('overflow-hidden')
    
    console.log('👂 Setting up listeners...')
    listenUserPublish()
    listenToCameraStatesChanges()
    
    nextTick(() => {
        // Set initial canvas size
        setTimeout(() => {
            console.log('⏰ Setting initial canvas size...')
            setCanvasSize()
            drawLineOnCanvas()
        }, 500)
        
        if (mainVideo.value) {
            mainVideo.value.onloadeddata = () => {
                console.log('📹 Main video loaded, updating canvas size...')
                setCanvasSize()
                drawLineOnCanvas()
            }
        }
        
        if (previewVideo.value) {
            previewVideo.value.onloadeddata = () => {
                console.log('📹 Preview video loaded')
            }
        }
        
        window.addEventListener('resize', () => {
            setCanvasSize()
            drawLineOnCanvas()
        })
    })
})

onBeforeUnmount(() => {
    clearSession()
})

const goToHome = () => {
    router.push('/')
}

const getAvailableCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        availableCameras.value = devices.filter((device) => device.kind === 'videoinput')
    } catch (error) {
        console.error('Error fetching available cameras:', error)
    }
}

const initializeCameraStates = async () => {
    try {
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        await setDoc(roomMetaDoc, {
            selectedCam: 1,
            camera1: selectedCameraId.value,
            camera2: selectedCamera2Id.value,
            camera1Name: camera1Name.value,
            camera2Name: camera2Name.value,
            camera1Mirror: true,
            camera2Mirror: false,
            updatedAt: Timestamp.now()
        }, { merge: true })
        
        console.log('✅ Initialized camera states')
    } catch (err) {
        console.error('❌ Error initializing camera states:', err)
    }
}

const initializeRoom = async () => {
    try {
        const roomCollection = collection(firestore.value, roomID.value)
        const roomInitDoc = doc(roomCollection, '_init')
        
        await setDoc(roomInitDoc, {
            createdAt: Timestamp.now(),
            createdBy: 'host',
            status: 'active'
        })
        
        console.log('✅ Room collection initialized')
    } catch (err) {
        console.error('❌ Error initializing room:', err)
    }
}

const listenToCameraStatesChanges = () => {
    const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
    onSnapshot(roomMetaDoc, async (snapshot) => {
        if (!snapshot.exists()) return
        
        const data = snapshot.data()
        const newCam = data.selectedCam
        const newCamera1Mirror = data.camera1Mirror
        const newCamera2Mirror = data.camera2Mirror
        
        if (newCamera1Mirror !== undefined) camera1Mirror.value = newCamera1Mirror
        if (newCamera2Mirror !== undefined) camera2Mirror.value = newCamera2Mirror
        
        if (newCam && newCam !== selectedCam.value) {
            isSwitchingCamera.value = true
            selectedCam.value = newCam
            const targetCameraId = newCam === 1 ? selectedCameraId.value : selectedCamera2Id.value
            
            if (targetCameraId && localVideoTrack.value) {
                try {
                    await switchCamera(targetCameraId)
                    await new Promise(resolve => setTimeout(resolve, 500))
                } catch (err) {
                    console.error('Error switching camera:', err)
                }
            }
            isSwitchingCamera.value = false
        }
    })
}

const switchCameraInternal = async () => {
    if (availableCameras.value.length < 2) return
    
    const currentIndex = availableCameras.value.findIndex(cam => cam.deviceId === selectedCameraId.value)
    const nextIndex = (currentIndex + 1) % availableCameras.value.length
    selectedCameraId.value = availableCameras.value[nextIndex].deviceId
    camera1Name.value = availableCameras.value[nextIndex].label || `Camera ${nextIndex + 1}`
    
    await stopCamera()
    await startCamera(selectedCameraId.value)
    await updateCameraStatesInFirestore()
}

const switchCamera2Internal = async () => {
    if (availableCameras.value.length < 2) return
    
    const currentIndex = availableCameras.value.findIndex(cam => cam.deviceId === selectedCamera2Id.value)
    const nextIndex = (currentIndex + 1) % availableCameras.value.length
    selectedCamera2Id.value = availableCameras.value[nextIndex].deviceId
    camera2Name.value = availableCameras.value[nextIndex].label || `Camera ${nextIndex + 1}`
    
    await stopCamera2()
    await startCamera2(selectedCamera2Id.value)
    await updateCameraStatesInFirestore()
}

const endCall = async () => {
    console.log('🔴 Ending call...')
    
    const endTime = Date.now()
    const totalTime = (endTime - startTime.value) / 1000
    const minutes = Math.floor(totalTime / 60)
    const seconds = Math.floor(totalTime % 60)
    totalDurationTime.value = `${minutes} minutes ${seconds} seconds`
    onCall.value = false
    
    console.log('⏱️ Call duration:', totalDurationTime.value)
    
    // Hapus database room
    await deleteRoomData()
    
    // Clear all media tracks and leave channel
    await clearSession()
    
    console.log('✅ Call ended successfully')
}

const deleteRoomData = async () => {
    try {
        // Hapus semua dokumen dalam collection room (termasuk annotations)
        const roomCollection = collection(firestore.value, roomID.value)
        const snapshot = await getDocs(roomCollection)
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
        await Promise.all(deletePromises)
        
        console.log('✅ All annotations deleted')
        
        // Hapus room-meta
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        await deleteDoc(roomMetaDoc)
        
        console.log('✅ Room data deleted successfully')
    } catch (err) {
        console.error('❌ Error deleting room data:', err)
    }
}

const clearAnnotation = async () => {
    try {
        const linesCollection = collection(firestore.value, roomID.value)
        const snapshot = await getDocs(linesCollection)
        
        // Hapus semua dokumen kecuali _init
        const deletePromises = snapshot.docs
            .filter(doc => doc.id !== '_init')
            .map(doc => deleteDoc(doc.ref))
        
        await Promise.all(deletePromises)
        lines.value = []
        drawLineOnCanvas()
    } catch (err) {
        console.error('Error clearing annotations:', err)
    }
}

const clearSession = async () => {
    console.log('🛑 Clearing session...')
    
    // Stop local audio track
    if (localAudioTrack.value) {
        localAudioTrack.value.stop()
        localAudioTrack.value.close()
        console.log('🎤 Audio track stopped and closed')
    }
    
    // Stop local video track
    if (localVideoTrack.value) {
        localVideoTrack.value.stop()
        localVideoTrack.value.close()
        console.log('📹 Video track stopped and closed')
    }
    
    // Leave Agora channel
    await leaveChannel()
    console.log('📞 Left channel')
    
    // Stop camera streams
    await stopCamera()
    await stopCamera2()
    
    // Clear video element srcObject
    if (mainVideo.value) {
        mainVideo.value.srcObject = null
        console.log('🎥 Main video cleared')
    }
    if (previewVideo.value) {
        previewVideo.value.srcObject = null
        console.log('🎥 Preview video cleared')
    }
    
    document.body.classList.remove('overflow-hidden')
    console.log('✅ Session cleared successfully')
}

const toggleMute = () => {
    if (localAudioTrack.value) {
        if (isMuted.value) {
            localAudioTrack.value.setEnabled(true)
        } else {
            localAudioTrack.value.setEnabled(false)
        }
        isMuted.value = !isMuted.value
    }
}

const startCamera = async (deviceId: string) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: false
        })
        camera1Stream.value = stream
        if (mainVideo.value && selectedCam.value === 1) {
            mainVideo.value.srcObject = stream
        }
        if (previewVideo.value && selectedCam.value === 2) {
            previewVideo.value.srcObject = stream
        }
        console.log('✅ Camera 1 stream started')
    } catch (error) {
        console.error("Could not access camera:", error)
    }
}

const startCamera2 = async (deviceId: string) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: false
        })
        camera2Stream.value = stream
        if (mainVideo.value && selectedCam.value === 2) {
            mainVideo.value.srcObject = stream
        }
        if (previewVideo.value && selectedCam.value === 1) {
            previewVideo.value.srcObject = stream
        }
        console.log('✅ Camera 2 stream started')
    } catch (error) {
        console.error("Could not access camera 2:", error)
    }
}

const stopCamera = async () => {
    if (!camera1Stream.value) return
    try {
        camera1Stream.value.getTracks().forEach((track) => track.stop())
        camera1Stream.value = null
        console.log('🛑 Camera 1 stopped')
    } catch (error) {
        console.error("Could not stop camera:", error)
    }
}

const stopCamera2 = async () => {
    if (!camera2Stream.value) return
    try {
        camera2Stream.value.getTracks().forEach((track) => track.stop())
        camera2Stream.value = null
        console.log('🛑 Camera 2 stopped')
    } catch (error) {
        console.error("Could not stop camera 2:", error)
    }
}

const updateCameraStatesInFirestore = async () => {
    try {
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        await setDoc(roomMetaDoc, {
            selectedCam: selectedCam.value,
            camera1: selectedCameraId.value,
            camera2: selectedCamera2Id.value,
            camera1Name: camera1Name.value,
            camera2Name: camera2Name.value,
            camera1Mirror: camera1Mirror.value,
            camera2Mirror: camera2Mirror.value,
            updatedAt: Timestamp.now()
        }, { merge: true })
    } catch (err) {
        console.error('Error updating camera states', err)
    }
}

const firestore = computed(() => {
    return $firestore as Firestore
})

const swapVideoStreams = () => {
    if (!mainVideo.value || !previewVideo.value) return
    
    if (selectedCam.value === 1) {
        // Show camera 1 on main, camera 2 on preview
        mainVideo.value.srcObject = camera1Stream.value
        previewVideo.value.srcObject = camera2Stream.value
    } else {
        // Show camera 2 on main, camera 1 on preview
        mainVideo.value.srcObject = camera2Stream.value
        previewVideo.value.srcObject = camera1Stream.value
    }
    
    console.log('🔄 Video streams swapped - Main:', selectedCam.value === 1 ? 'Camera 1' : 'Camera 2')
}

const join = async () => {
    startTime.value = Date.now()
    onCall.value = true

    console.log('🎬 Starting join process...')
    const res = await joinChannel(selectedCameraId.value ?? undefined)
    console.log('✅ Channel joined successfully')
    
    const localElement = document.getElementById('local-stream')
    if (localElement) {
        res?.localVideoTrack.value?.play(localElement)
        console.log('📹 Local video track playing')
    } else {
        console.warn('⚠️ Local stream element not found')
    }
    
    await updateCameraStatesInFirestore()
    console.log('💾 Camera states updated in Firestore')
}

const listenToDrawingUpdates = async () => {
    const linesCollection = collection(firestore.value, roomID.value)
    const q = query(linesCollection, orderBy('timestamp'))
    onSnapshot(q, (snapshot) => {
        const annotationDocs = snapshot.docs.filter(doc => doc.id !== '_init')
        showEraserLine.value = annotationDocs.length > 0
        lines.value = annotationDocs.map(doc => doc.data() as LineData)
        
        // Debug logging
        console.log('📝 Total annotations:', lines.value.length)
        console.log('📝 Annotations by role:', {
            host: lines.value.filter(l => l.role === 1).length,
            participant: lines.value.filter(l => l.role === 2).length
        })
        
        drawLineOnCanvas()
    })
}

const setCanvasSize = () => {
    if (!canvas.value) return
    ctxCanvas.value = canvas.value.getContext('2d')
    if (ctxCanvas.value) {
        const video = mainVideo.value
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
    
    ctxCanvas.value.save()
    
    if (currentMirrorState.value) {
        ctxCanvas.value.translate(canvas.value.width, 0)
        ctxCanvas.value.scale(-1, 1)
    }
    
    lines.value.forEach((lineData) => {
        if (ctxCanvas.value && canvas.value) {
            const width = canvas.value.width
            const height = canvas.value.height
            
            const color = lineData.color || (lineData.role === 1 ? 'blue' : 'red')
            
            ctxCanvas.value.strokeStyle = color
            ctxCanvas.value.beginPath()
            ctxCanvas.value.moveTo(lineData.startX * width, lineData.startY * height)
            ctxCanvas.value.lineTo(lineData.endX * width, lineData.endY * height)
            ctxCanvas.value.stroke()
        }
    })
    
    ctxCanvas.value.restore()
}

const listenUserPublish = async () => {
    console.log('👂 Setting up user publish listeners...')
    
    client.value.on('user-published', async (user: { uid: any; videoTrack: any; audioTrack: any }, mediaType: string) => {
        console.log('📢 User published:', user.uid, 'Media type:', mediaType)
        
        if (user.uid === userUUID.value) {
            console.log('⏭️ Skipping own user')
            return
        }
        
        if (mediaType === 'video') {
            console.log('🎥 Subscribing to video from:', user.uid)
            await client.value.subscribe(user, 'video')
            const remoteStream = user.videoTrack
            
            // Set hasRemoteVideo first to trigger Vue to render the element
            hasRemoteVideo.value = true
            console.log('✅ hasRemoteVideo set to true, waiting for element...')
            
            // Wait for Vue to render the element
            await nextTick()
            
            // Small additional delay to ensure DOM is ready
            setTimeout(() => {
                const remoteElement = document.getElementById('remote-stream')
                if (remoteElement) {
                    remoteStream.play(remoteElement)
                    console.log('✅ Remote video playing in element')
                } else {
                    console.error('❌ Remote stream element still not found after nextTick!')
                }
            }, 100)
            
        } else if (mediaType === 'audio') {
            console.log('🎵 Subscribing to audio from:', user.uid)
            await client.value.subscribe(user, 'audio')
            user.audioTrack.play()
            console.log('✅ Remote audio playing')
        }
    })
    
    client.value.on('user-unpublished', (user: { uid: any }, mediaType: string) => {
        console.log('📴 User unpublished:', user.uid, 'Media type:', mediaType)
        if (mediaType === 'video') {
            hasRemoteVideo.value = false
            console.log('⚠️ Remote video stopped, hasRemoteVideo set to false')
        }
    })
    
    client.value.on('user-joined', (user: { uid: any }) => {
        console.log('👋 User joined:', user.uid)
    })
    
    client.value.on('user-left', (user: { uid: any }) => {
        console.log('👋 User left:', user.uid)
        hasRemoteVideo.value = false
    })
}

const adjustCoordinatesForMirror = (x: number, y: number): { x: number, y: number } => {
    if (currentMirrorState.value && canvas.value) {
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
        role: 1,
        color: 'blue',
        timestamp: Timestamp.now()
    }
    lines.value.push(lineData)
    addLineDataToFirestore(lineData)
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
        role: 1,
        color: 'blue',
        timestamp: Timestamp.now()
    }
    lines.value.push(lineData)
    addLineDataToFirestore(lineData)
    drawLineOnCanvas()
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const addLineDataToFirestore = async (lineData: LineData) => {
    try {
      const linesCollection = collection(firestore.value, roomID.value)
      await addDoc(linesCollection, lineData)
    } catch (err) {
      console.error('Error saving line data', err)
    }
}
</script>