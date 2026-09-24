module MotionBehaviors exposing (Finish(..), Motion, behaviorAttributes, default)

import Html exposing (Attribute)
import Html.Attributes exposing (attribute)


type Finish
    = Visible
    | Hidden
    | Remove


type alias Motion =
    { enter : String
    , exit : Maybe String
    , wait : String
    , finish : Finish
    , group : String
    , last : Bool
    }


default : Motion
default =
    { enter = "fadeIn"
    , exit = Just "fadeOut"
    , wait = "1s"
    , finish = Hidden
    , group = "default"
    , last = False
    }


behaviorAttributes : Motion -> List (Attribute msg)
behaviorAttributes motion =
    let
        behavior =
            String.join " "
                ([ "animate", "el-in" ]
                    ++ (case motion.exit of
                            Just _ -> [ "el-out" ]
                            Nothing -> []
                       )
                    ++ (if motion.last then [ "last" ] else [])
                )

        finish =
            case motion.finish of
                Visible -> "visible"
                Hidden -> "hidden"
                Remove -> "remove"
    in
    [ attribute "data-behavior" behavior
    , attribute "data-motion-group" motion.group
    , attribute "data-motion-in" motion.enter
    , attribute "data-motion-wait" motion.wait
    , attribute "data-motion-finish" finish
    ]
        ++ (case motion.exit of
                Just value -> [ attribute "data-motion-out" value ]
                Nothing -> []
           )
