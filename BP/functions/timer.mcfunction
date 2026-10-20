#camera
execute at @e[tag=camera,c=1] run scoreboard players add camera_timer ticks 1
execute at @e[tag=camera,c=1] as @p run camera @s set minecraft:free ease 0.1 in_cubic pos ~2 ~2 ~2 facing @e[tag=camera,c=1]

execute at @e[tag=camera] if score camera_timer ticks matches 200.. run event entity @e[tag=camera] vp:clear_camera
execute at @e[tag=camera] if score camera_timer ticks matches 200.. run tag @e[tag=camera] remove camera
execute at @e[tag=camera] if score camera_timer ticks matches 200.. run camera @a clear

execute if score camera_timer ticks matches 200.. run scoreboard players set camera_timer ticks 0


#reqCheck
scoreboard players add @e[family=pinata] req_timer 1
scoreboard players add @e[family=garden] req_timer 1

execute as @e[family=pinata, family=wild] if score @s req_timer matches 20 run event entity @s vp:visit_garden
execute as @e[family=garden] if score @s req_timer matches 20 run event entity @s vp:detect_entities

execute as @e if score @s req_timer matches 20.. run scoreboard players reset @s req_timer 

#item pickups
scoreboard players add @e[family=pinata, family=wild] req1 0

#increase candiosity of resident pinata
scoreboard players add candy_timer ticks 1
execute if score candy_timer ticks matches 6000.. run event entity @e[family=resident] vp:increase_candiosity
execute if score candy_timer ticks matches 6000.. run scoreboard players set candy_timer ticks 0
