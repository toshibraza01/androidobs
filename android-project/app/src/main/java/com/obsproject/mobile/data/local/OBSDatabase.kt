package com.obsproject.mobile.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "scenes")
data class SceneEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "is_active") val isActive: Boolean = false,
    @ColumnInfo(name = "width") val width: Int = 1920,
    @ColumnInfo(name = "height") val height: Int = 1080
)

@Entity(
    tableName = "sources",
    foreignKeys = [
        ForeignKey(
            entity = SceneEntity::class,
            parentColumns = ["id"],
            childColumns = ["scene_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["scene_id"])]
)
data class SourceEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "scene_id") val sceneId: Long,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "type") val type: String, // "CAMERA", "SCREEN", "TEXT", "IMAGE"
    @ColumnInfo(name = "pos_x") val posX: Float,
    @ColumnInfo(name = "pos_y") val posY: Float,
    @ColumnInfo(name = "width") val width: Float,
    @ColumnInfo(name = "height") val height: Float,
    @ColumnInfo(name = "z_order") val zOrder: Int = 0,
    @ColumnInfo(name = "is_visible") val isVisible: Boolean = true
)

@Dao
interface SceneDao {
    @Query("SELECT * FROM scenes ORDER BY id ASC")
    fun getAllScenes(): Flow<List<SceneEntity>>

    @Query("SELECT * FROM scenes WHERE is_active = 1 LIMIT 1")
    fun getActiveScene(): Flow<SceneEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScene(scene: SceneEntity): Long

    @Query("UPDATE scenes SET is_active = CASE WHEN id = :sceneId THEN 1 ELSE 0 END")
    suspend fun setActiveScene(sceneId: Long)

    @Delete
    suspend fun deleteScene(scene: SceneEntity)
}

@Dao
interface SourceDao {
    @Query("SELECT * FROM sources WHERE scene_id = :sceneId ORDER BY z_order ASC")
    fun getSourcesForScene(sceneId: Long): Flow<List<SourceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSource(source: SourceEntity): Long

    @Update
    suspend fun updateSource(source: SourceEntity)

    @Delete
    suspend fun deleteSource(source: SourceEntity)
}

@Database(entities = [SceneEntity::class, SourceEntity::class], version = 1, exportSchema = false)
abstract class OBSDatabase : RoomDatabase() {
    abstract fun sceneDao(): SceneDao
    abstract fun sourceDao(): SourceDao
}