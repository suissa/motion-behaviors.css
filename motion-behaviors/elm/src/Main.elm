module Main exposing (main)

import Browser
import Html exposing (Html, div, h1, img, text)
import Html.Attributes exposing (src)
import MotionBehaviors exposing (Finish(..), behaviorAttributes, default)


main =
    Browser.sandbox
        { init = ()
        , update = \_ model -> model
        , view = view
        }


view : () -> Html msg
view _ =
    div []
        [ h1 [] [ text "motion-behaviors.css + Elm" ]
        , img
            ([ src "../../logo1.png" ]
                ++ behaviorAttributes
                    { default
                        | enter = "zoomInDown"
                        , exit = Just "zoomOutDown"
                        , wait = "2s"
                    }
            )
            []
        , div
            (behaviorAttributes
                { default
                    | enter = "bounceIn"
                    , exit = Nothing
                    , finish = Visible
                    , last = True
                }
            )
            [ text "Final Elm element" ]
        ]
